/**
 * @file MPU6050Driver.cpp
 * @brief MPU6050 六轴传感器驱动实现（基于 InvenSense 官方数据手册 PS-MPU-6000A-003）
 * @project TremorGuard 震颤检测手环固件
 * @hardware Seeed Studio XIAO ESP32C3 + MPU6050
 *
 * @details
 * 本实现通过 ESP32 Arduino 核心自带的 Wire.h 进行 I2C 通信，不依赖任何第三方库。
 * 初始化流程遵循数据手册推荐顺序：
 *   1) 上电 / 软件复位 (PWR_MGMT_1 bit7=1)
 *   2) 等待复位完成 (~100ms)
 *   3) 唤醒：清除 SLEEP 位，选择时钟源 (CLKSEL=1, PLL with X axis gyroscope reference)
 *   4) 配置 DLPF (CONFIG)、采样率 (SMPLRT_DIV)、量程 (GYRO_CONFIG / ACCEL_CONFIG)
 *   5) 校准：静止采样求平均得到偏移量
 */

#include "MPU6050Driver.h"

/* PWR_MGMT_1 寄存器位定义 */
#define BIT_DEVICE_RESET        0x80    /**< bit7: 写 1 触发设备复位，复位后自动清零 */
#define BIT_SLEEP               0x40    /**< bit6: 1=睡眠模式，0=正常工作 */
#define BIT_CLKSEL_MASK         0x07    /**< bit[2:0]: 时钟源选择 */
#define CLKSEL_PLL_X_GYRO       0x01    /**< PLL with X axis gyroscope reference (推荐，比内部 RC 更稳定) */

/* 默认校准参数 */
#define DEFAULT_CALIB_SAMPLES   1024    /**< 默认校准样本数 */

/* ============================================================
 * 构造函数
 * ============================================================ */

MPU6050Driver::MPU6050Driver() : _calibrated(false) {
    // 默认配置：XIAO ESP32C3 I2C 引脚 + 震颤检测推荐参数
    _cfg.i2cAddress    = MPU6050_ADDR_LOW;
    _cfg.sdaPin        = 6;                // XIAO ESP32C3 D4 = GPIO6 (SDA)
    _cfg.sclPin        = 7;                // XIAO ESP32C3 D5 = GPIO7 (SCL)
    _cfg.i2cFreq       = 400000;           // 400kHz Fast Mode（兼容性不好时自动回退 100k）
    _cfg.accelFS       = AFS_4G;           // ±4g，灵敏度 8192 LSB/g
    _cfg.gyroFS        = GFS_500DPS;       // ±500°/s，灵敏度 65.5 LSB/°/s
    _cfg.sampleRateDiv = 9;                // 采样率 = 1kHz / (1+9) = 100Hz
    _cfg.dlpf          = DLPF_44_42;       // 加速度带宽 44Hz / 陀螺仪带宽 42Hz
    memset(&_offsets, 0, sizeof(_offsets));
    _activeAddr = 0;
    _activeFreq = 0;
    _lastWhoAmI = 0;
}

MPU6050Driver::MPU6050Driver(const MPU6050Config &cfg)
    : _cfg(cfg), _calibrated(false) {
    memset(&_offsets, 0, sizeof(_offsets));
    _activeAddr = 0;
    _activeFreq = 0;
    _lastWhoAmI = 0;
}

/* ============================================================
 * 底层 I2C 读写
 * ============================================================ */

bool MPU6050Driver::writeRegister(uint8_t reg, uint8_t value) {
    Wire.beginTransmission(_cfg.i2cAddress);
    Wire.write(reg);
    Wire.write(value);
    // endTransmission 返回值: 0=成功，其余为错误
    return (Wire.endTransmission() == 0);
}

bool MPU6050Driver::readRegister(uint8_t reg, uint8_t &value) {
    Wire.beginTransmission(_cfg.i2cAddress);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0) {  // false 发送重复起始位
        return false;
    }
    Wire.requestFrom((int)_cfg.i2cAddress, 1);
    if (Wire.available() < 1) {
        return false;
    }
    value = Wire.read();
    return true;
}

bool MPU6050Driver::readRegisters(uint8_t reg, uint8_t *buffer, uint8_t length) {
    Wire.beginTransmission(_cfg.i2cAddress);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0) {
        return false;
    }
    Wire.requestFrom((int)_cfg.i2cAddress, (int)length);
    uint8_t received = 0;
    while (Wire.available() && received < length) {
        buffer[received++] = Wire.read();
    }
    return (received == length);
}

/* ============================================================
 * 初始化
 * ============================================================ */

bool MPU6050Driver::begin(bool autoDetect) {
    if (autoDetect) {
        // 自动探测矩阵：2 个地址 × 2 个频率，共 4 种组合，优先用户配置
        const uint8_t  addrCandidates[] = { _cfg.i2cAddress,
                                            (_cfg.i2cAddress == MPU6050_ADDR_LOW) ? MPU6050_ADDR_HIGH : MPU6050_ADDR_LOW };
        const uint32_t freqCandidates[] = { _cfg.i2cFreq,
                                            (_cfg.i2cFreq == 400000) ? 100000 : 400000 };

        for (int ai = 0; ai < 2; ai++) {
            for (int fi = 0; fi < 2; fi++) {
                Wire.end();  // 结束前一次 Wire 状态，避免引脚/频率冲突
                delay(2);
                if (tryInitAt(addrCandidates[ai], freqCandidates[fi])) {
                    return true;
                }
            }
        }
        return false;
    }
    // 非自动探测：仅使用 cfg 指定值
    Wire.end();
    delay(2);
    return tryInitAt(_cfg.i2cAddress, _cfg.i2cFreq);
}

bool MPU6050Driver::tryInitAt(uint8_t addr, uint32_t freq) {
    // 1. 初始化 I2C 总线
    Wire.begin(_cfg.sdaPin, _cfg.sclPin, freq);
    // 临时把当前地址写入 _cfg，供底层 writeRegister/readRegister 使用
    uint8_t oldAddr = _cfg.i2cAddress;
    _cfg.i2cAddress = addr;

    // 2. 读取 WHO_AM_I：验证设备响应
    uint8_t id = whoAmI();
    // 使用宽松校验：非 0x00 / 非 0xFF 视为有效（兼容克隆/替代模块）
    if (!WHO_AM_I_VALID(id)) {
        _cfg.i2cAddress = oldAddr;
        return false;
    }

    // 3. 软件复位：写 PWR_MGMT_1 bit7=1，所有寄存器恢复默认
    if (!writeRegister(REG_PWR_MGMT_1, BIT_DEVICE_RESET)) {
        _cfg.i2cAddress = oldAddr;
        return false;
    }
    delay(100);  // 数据手册建议复位后等待至少 100ms 再访问寄存器

    // 4. 唤醒设备并选择时钟源
    //    上电默认 SLEEP=1（睡眠），需写 0 唤醒；
    //    CLKSEL=1 使用 X 轴陀螺仪 PLL 作为时钟源，比内部 RC 振荡器更稳定（数据手册推荐）
    if (!writeRegister(REG_PWR_MGMT_1, CLKSEL_PLL_X_GYRO)) {
        _cfg.i2cAddress = oldAddr;
        return false;
    }
    delay(10);  // 等待时钟源稳定

    // 5. 应用配置（量程、采样率、DLPF）
    if (!applyConfig()) {
        _cfg.i2cAddress = oldAddr;
        return false;
    }

    // 6. 保存实际生效的地址与频率（_cfg.i2cAddress 保持为探测到的那个，不用回滚）
    _activeAddr = addr;
    _activeFreq = freq;
    return true;
}

void MPU6050Driver::scanI2CBus(Print &out) {
    out.println(F("[I2C-SCAN] 扫描 I2C 总线 (地址 0x01 ~ 0x7F)..."));
    out.print  (F("[I2C-SCAN]   SDA=GPIO")); out.print(_cfg.sdaPin);
    out.print  (F(", SCL=GPIO"));            out.print(_cfg.sclPin);
    out.print  (F(", Freq="));               out.print(_cfg.i2cFreq);
    out.println(F(" Hz"));

    // 用两个常用频率各扫一遍
    const uint32_t scanFreqs[] = { 400000, 100000 };
    for (int fi = 0; fi < 2; fi++) {
        uint32_t freq = scanFreqs[fi];
        Wire.end();
        delay(2);
        Wire.begin(_cfg.sdaPin, _cfg.sclPin, freq);
        out.print(F("[I2C-SCAN]   频率 ")); out.print(freq); out.print(F(" Hz  找到设备："));
        uint8_t count = 0;
        for (uint8_t addr = 1; addr < 127; addr++) {
            Wire.beginTransmission(addr);
            uint8_t err = Wire.endTransmission();
            if (err == 0) {
                out.print(F(" 0x"));
                if (addr < 16) out.print(F("0"));
                out.print(addr, HEX);
                // 标注已知地址
                if (addr == 0x68 || addr == 0x69) {
                    out.print(F("<MPU6050"));
                    out.print(addr == 0x68 ? F(" AD0=GND") : F(" AD0=HIGH"));
                    out.print(F(">"));
                }
                count++;
            }
        }
        if (count == 0) out.print(F(" (无)"));
        out.println();
    }
    out.println(F("[I2C-SCAN] 完成。"));
}

bool MPU6050Driver::applyConfig() {
    // 5.1 配置数字低通滤波器 DLPF_CFG（同时使陀螺仪输出率=1kHz，采样率公式才成立）
    if (!writeRegister(REG_CONFIG, (uint8_t)_cfg.dlpf)) {
        return false;
    }

    // 5.2 配置采样率分频器：Sample Rate = 1kHz / (1 + SMPLRT_DIV)
    if (!writeRegister(REG_SMPLRT_DIV, _cfg.sampleRateDiv)) {
        return false;
    }

    // 5.3 配置陀螺仪量程 GYRO_FS_SEL
    if (!writeRegister(REG_GYRO_CONFIG, (uint8_t)_cfg.gyroFS)) {
        return false;
    }

    // 5.4 配置加速度计量程 ACCEL_FS_SEL
    if (!writeRegister(REG_ACCEL_CONFIG, (uint8_t)_cfg.accelFS)) {
        return false;
    }

    return true;
}

/* ============================================================
 * 量程灵敏度计算
 * ============================================================ */

float MPU6050Driver::accelSensitivity() const {
    // 根据数据手册 ACCEL_FS_SEL 对应灵敏度（LSB/g）
    switch (_cfg.accelFS) {
        case AFS_2G:   return 16384.0f;
        case AFS_4G:   return 8192.0f;
        case AFS_8G:   return 4096.0f;
        case AFS_16G:  return 2048.0f;
        default:       return 8192.0f;  // 安全回退
    }
}

float MPU6050Driver::gyroSensitivity() const {
    // 根据数据手册 GYRO_FS_SEL 对应灵敏度（LSB/°/s）
    switch (_cfg.gyroFS) {
        case GFS_250DPS:  return 131.0f;
        case GFS_500DPS:  return 65.5f;
        case GFS_1000DPS: return 32.8f;
        case GFS_2000DPS: return 16.4f;
        default:          return 65.5f;  // 安全回退
    }
}

/* ============================================================
 * 校准
 * ============================================================ */

bool MPU6050Driver::calibrate(uint16_t calibrationSamples) {
    if (calibrationSamples == 0) {
        calibrationSamples = DEFAULT_CALIB_SAMPLES;
    }

    // 累加器（使用 32 位防止大量样本累加溢出）
    int32_t sumAx = 0, sumAy = 0, sumAz = 0;
    int32_t sumGx = 0, sumGy = 0, sumGz = 0;
    uint16_t validCount = 0;

    uint8_t buffer[14];  // 一次性读取加速度(6) + 温度(2) + 陀螺仪(6) = 14 字节
    // 实际采样率 = 1kHz / (1 + sampleRateDiv)
    const uint32_t sampleRateHz = 1000UL / (1UL + _cfg.sampleRateDiv);
    const uint32_t intervalUs = (sampleRateHz > 0) ? (1000000UL / sampleRateHz) : 10000UL;

    for (uint16_t i = 0; i < calibrationSamples; i++) {
        uint32_t t0 = micros();

        // 从 REG_ACCEL_XOUT_H(0x3B) 连续读取 14 字节
        if (!readRegisters(REG_ACCEL_XOUT_H, buffer, 14)) {
            continue;  // 单次读取失败跳过，不中断整体校准
        }

        int16_t axRaw = toInt16(buffer[0], buffer[1]);
        int16_t ayRaw = toInt16(buffer[2], buffer[3]);
        int16_t azRaw = toInt16(buffer[4], buffer[5]);
        // buffer[6..7] 为温度，校准不需要
        int16_t gxRaw = toInt16(buffer[8],  buffer[9]);
        int16_t gyRaw = toInt16(buffer[10], buffer[11]);
        int16_t gzRaw = toInt16(buffer[12], buffer[13]);

        sumAx += axRaw; sumAy += ayRaw; sumAz += azRaw;
        sumGx += gxRaw; sumGy += gyRaw; sumGz += gzRaw;
        validCount++;

        // 控制采样节奏，匹配传感器输出率，避免读到重复样本
        uint32_t elapsed = micros() - t0;
        if (elapsed < intervalUs) {
            delayMicroseconds(intervalUs - elapsed);
        }
    }

    if (validCount == 0) {
        _calibrated = false;
        return false;
    }

    // 计算平均值（原始 LSB）
    float meanAx = (float)sumAx / validCount;
    float meanAy = (float)sumAy / validCount;
    float meanAz = (float)sumAz / validCount;
    float meanGx = (float)sumGx / validCount;
    float meanGy = (float)sumGy / validCount;
    float meanGz = (float)sumGz / validCount;

    // 陀螺仪偏移：静止时三轴期望为 0，偏移 = 平均值
    _offsets.gx = (int16_t)lroundf(meanGx);
    _offsets.gy = (int16_t)lroundf(meanGy);
    _offsets.gz = (int16_t)lroundf(meanGz);

    // 加速度偏移：静止平放时 X/Y 期望为 0，Z 轴期望为 1g（灵敏度 LSB/g）
    // 偏移 = 平均值 - 期望值
    float accelSens = accelSensitivity();
    _offsets.ax = (int16_t)lroundf(meanAx - 0.0f);
    _offsets.ay = (int16_t)lroundf(meanAy - 0.0f);
    _offsets.az = (int16_t)lroundf(meanAz - accelSens);  // 扣除 1g 重力分量

    _calibrated = true;
    return true;
}

/* ============================================================
 * 数据读取
 * ============================================================ */

bool MPU6050Driver::readAcceleration(AccelData &outAccel) {
    uint8_t buffer[6];
    // 从 0x3B 起连续读取 6 字节：ACCEL_XOUT_H/L, ACCEL_YOUT_H/L, ACCEL_ZOUT_H/L
    if (!readRegisters(REG_ACCEL_XOUT_H, buffer, 6)) {
        return false;
    }

    int16_t axRaw = toInt16(buffer[0], buffer[1]) - _offsets.ax;
    int16_t ayRaw = toInt16(buffer[2], buffer[3]) - _offsets.ay;
    int16_t azRaw = toInt16(buffer[4], buffer[5]) - _offsets.az;

    // 单位换算：原始 LSB → g
    float sens = accelSensitivity();
    outAccel.x = axRaw / sens;
    outAccel.y = ayRaw / sens;
    outAccel.z = azRaw / sens;
    return true;
}

bool MPU6050Driver::readGyroscope(GyroData &outGyro) {
    uint8_t buffer[6];
    // 从 0x43 起连续读取 6 字节：GYRO_XOUT_H/L, GYRO_YOUT_H/L, GYRO_ZOUT_H/L
    if (!readRegisters(REG_GYRO_XOUT_H, buffer, 6)) {
        return false;
    }

    int16_t gxRaw = toInt16(buffer[0], buffer[1]) - _offsets.gx;
    int16_t gyRaw = toInt16(buffer[2], buffer[3]) - _offsets.gy;
    int16_t gzRaw = toInt16(buffer[4], buffer[5]) - _offsets.gz;

    // 单位换算：原始 LSB → °/s
    float sens = gyroSensitivity();
    outGyro.x = gxRaw / sens;
    outGyro.y = gyRaw / sens;
    outGyro.z = gzRaw / sens;
    return true;
}

bool MPU6050Driver::readMotion6(AccelData &outAccel, GyroData &outGyro) {
    // 一次性读取 14 字节：加速度(6) + 温度(2) + 陀螺仪(6)，减少 I2C 事务开销
    // 起始地址 0x3B = REG_ACCEL_XOUT_H，温度在 0x41-0x42，陀螺仪在 0x43-0x48
    uint8_t buffer[14];
    if (!readRegisters(REG_ACCEL_XOUT_H, buffer, 14)) {
        return false;
    }

    int16_t axRaw = toInt16(buffer[0], buffer[1]) - _offsets.ax;
    int16_t ayRaw = toInt16(buffer[2], buffer[3]) - _offsets.ay;
    int16_t azRaw = toInt16(buffer[4], buffer[5]) - _offsets.az;
    // buffer[6..7] = 温度（此处忽略）
    int16_t gxRaw = toInt16(buffer[8],  buffer[9])  - _offsets.gx;
    int16_t gyRaw = toInt16(buffer[10], buffer[11]) - _offsets.gy;
    int16_t gzRaw = toInt16(buffer[12], buffer[13]) - _offsets.gz;

    float aSens = accelSensitivity();
    float gSens = gyroSensitivity();
    outAccel.x = axRaw / aSens;
    outAccel.y = ayRaw / aSens;
    outAccel.z = azRaw / aSens;
    outGyro.x  = gxRaw / gSens;
    outGyro.y  = gyRaw / gSens;
    outGyro.z  = gzRaw / gSens;
    return true;
}

bool MPU6050Driver::readTemperature(float &outTemp) {
    uint8_t buffer[2];
    if (!readRegisters(REG_TEMP_OUT_H, buffer, 2)) {
        return false;
    }
    int16_t tempRaw = toInt16(buffer[0], buffer[1]);
    // 数据手册公式: T(°C) = TEMP_OUT / 340 + 36.53
    outTemp = (tempRaw / 340.0f) + 36.53f;
    return true;
}

uint8_t MPU6050Driver::whoAmI() {
    uint8_t value = 0;
    // 关键寄存器读取允许重读 2 次，避免单次毛刺误判
    for (int retry = 0; retry < 2; retry++) {
        if (readRegister(REG_WHO_AM_I, value)) {
            _lastWhoAmI = value;
            return value;
        }
        delay(1);
    }
    _lastWhoAmI = 0x00;
    return 0x00;  // 通信失败返回 0
}
