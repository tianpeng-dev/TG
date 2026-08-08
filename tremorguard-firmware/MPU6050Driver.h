/**
 * @file MPU6050Driver.h
 * @brief MPU6050 六轴传感器驱动头文件（基于 InvenSense 官方数据手册 PS-MPU-6000A-003 实现）
 * @project TremorGuard 震颤检测手环固件
 * @hardware Seeed Studio XIAO ESP32C3 + MPU6050
 *
 * @details
 * 本驱动仅依赖 ESP32 Arduino 核心自带的 Wire.h（I2C），不使用任何第三方 MPU6050 库。
 * 所有寄存器地址、量程灵敏度、采样率分频公式均严格依据 MPU6050 官方数据手册：
 *   - 采样率公式: Sample Rate = 1kHz / (1 + SMPLRT_DIV)（DLPF 启用时，陀螺仪输出率=1kHz）
 *   - 加速度量程灵敏度: ±2g=16384 LSB/g, ±4g=8192 LSB/g, ±8g=4096 LSB/g, ±16g=2048 LSB/g
 *   - 陀螺仪量程灵敏度: ±250°/s=131 LSB/°/s, ±500=65.5, ±1000=32.8, ±2000=16.4
 *   - 温度公式: T(°C) = TEMP_OUT / 340 + 36.53
 *
 * 适用于帕金森震颤检测：震颤主频 4~6Hz，采样率 ≥50Hz（奈奎斯特），本驱动默认 100Hz。
 */

#ifndef MPU6050_DRIVER_H
#define MPU6050_DRIVER_H

#include <Arduino.h>
#include <Wire.h>

/* ============================================================
 * MPU6050 寄存器地址定义（取自官方数据手册 Register Map 章节）
 * ============================================================ */
#define MPU6050_ADDR_LOW        0x68    /**< I2C 设备地址（AD0 引脚接地） */
#define MPU6050_ADDR_HIGH       0x69    /**< I2C 设备地址（AD0 引脚接高） */

// 采样率分频器 (Sample Rate Divider)
#define REG_SMPLRT_DIV          0x19    /**< 采样率 = 1kHz / (1 + 该值) */
// 配置寄存器 (Configuration, DLPF)
#define REG_CONFIG              0x1A    /**< bit[2:0]=DLPF_CFG 数字低通滤波配置 */
// 陀螺仪配置寄存器
#define REG_GYRO_CONFIG         0x1B    /**< bit[4:3]=GYRO_FS_SEL 陀螺仪量程 */
// 加速度计配置寄存器
#define REG_ACCEL_CONFIG        0x1C    /**< bit[7:6]=ACCEL_FS_SEL 加速度量程 */
// 加速度计偏移寄存器（硬件偏移，本驱动主要使用软件校准，此处保留以备扩展）
#define REG_XA_OFFS_H           0x06
#define REG_XA_OFFS_L           0x07
#define REG_YA_OFFS_H           0x08
#define REG_YA_OFFS_L           0x09
#define REG_ZA_OFFS_H           0x0A
#define REG_ZA_OFFS_L           0x0B
// 陀螺仪偏移寄存器（硬件偏移）
#define REG_XG_OFFS_USR_H       0x13
#define REG_XG_OFFS_USR_L       0x14
#define REG_YG_OFFS_USR_H       0x15
#define REG_YG_OFFS_USR_L       0x16
#define REG_ZG_OFFS_USR_H       0x17
#define REG_ZG_OFFS_USR_L       0x18

// 加速度计测量数据寄存器（6 字节，X/Y/Z 高低字节）
#define REG_ACCEL_XOUT_H        0x3B
#define REG_ACCEL_XOUT_L        0x3C
#define REG_ACCEL_YOUT_H        0x3D
#define REG_ACCEL_YOUT_L        0x3E
#define REG_ACCEL_ZOUT_H        0x3F
#define REG_ACCEL_ZOUT_L        0x40
// 温度测量数据寄存器
#define REG_TEMP_OUT_H          0x41
#define REG_TEMP_OUT_L          0x42
// 陀螺仪测量数据寄存器（6 字节，X/Y/Z 高低字节）
#define REG_GYRO_XOUT_H         0x43
#define REG_GYRO_XOUT_L         0x44
#define REG_GYRO_YOUT_H         0x45
#define REG_GYRO_YOUT_L         0x46
#define REG_GYRO_ZOUT_H         0x47
#define REG_GYRO_ZOUT_L         0x48

// 电源管理寄存器
#define REG_PWR_MGMT_1          0x6B    /**< bit[7]=DEVICE_RESET, bit[6]=SLEEP, bit[2:0]=CLKSEL */
#define REG_PWR_MGMT_2          0x6C    /**< bit[5:3]=STBY_XA/YA/ZA, bit[2:0]=STBY_XG/YG/ZG */
// 设备 ID 寄存器
#define REG_WHO_AM_I            0x75    /**< MPU6050 该寄存器读出 0x68 */

#define WHO_AM_I_MPU6050        0x68    /**< MPU6050 WHO_AM_I 官方期望值 */

/**
 * @brief WHO_AM_I 兼容 ID 集合（含常见兼容/克隆模块）
 * @details 经验表明：
 *   - 0x68 = 原装 MPU6050 / InvenSense 原厂
 *   - 0x70 = 部分低成本克隆模块（MPU6050-6050 替代版）
 *   - 0x98 = 部分 QMI8658C 兼容模块（地址右移后 0x4C 左移变 0x98? 实际是 Wire 使用 7 位地址，此处用 8 位右移后 7 位）
 *   统一用 Wire 7 位地址，因此 ID 为原始 7 位值。
 *   为避免误杀，驱动仅验证"是否响应 I2C + 读写非全 0/全 FF"，不强制严格匹配 ID。
 */
#define WHO_AM_I_VALID(id)    ((id) != 0x00 && (id) != 0xFF)  /**< 非全 0 非全 FF 即视为有效 */

/* ============================================================
 * 量程配置枚举
 * ============================================================ */

/** 加速度计满量程选择（ACCEL_FS_SEL） */
enum AccelFullScale : uint8_t {
    AFS_2G  = 0x00,   /**< ±2g,  灵敏度 16384 LSB/g */
    AFS_4G  = 0x08,   /**< ±4g,  灵敏度 8192  LSB/g (默认，适合震颤检测) */
    AFS_8G  = 0x10,   /**< ±8g,  灵敏度 4096  LSB/g */
    AFS_16G = 0x18    /**< ±16g, 灵敏度 2048  LSB/g */
};

/** 陀螺仪满量程选择（GYRO_FS_SEL） */
enum GyroFullScale : uint8_t {
    GFS_250DPS  = 0x00,  /**< ±250°/s,  灵敏度 131   LSB/°/s */
    GFS_500DPS  = 0x08,  /**< ±500°/s,  灵敏度 65.5  LSB/°/s (默认，适合震颤检测) */
    GFS_1000DPS = 0x10,  /**< ±1000°/s, 灵敏度 32.8  LSB/°/s */
    GFS_2000DPS = 0x18   /**< ±2000°/s, 灵敏度 16.4  LSB/°/s */
};

/** 数字低通滤波配置（DLPF_CFG） */
enum DLPFCfg : uint8_t {
    DLPF_260_256 = 0x00,  /**< 加速度带宽260Hz/延迟0ms, 陀螺仪带宽256Hz/延迟0.98ms */
    DLPF_184_188 = 0x01,  /**< 加速度184Hz/2.0ms, 陀螺仪188Hz/1.9ms */
    DLPF_94_98   = 0x02,  /**< 加速度94Hz/3.0ms,  陀螺仪98Hz/2.8ms */
    DLPF_44_42   = 0x03,  /**< 加速度44Hz/4.9ms,  陀螺仪42Hz/4.8ms (震颤检测推荐) */
    DLPF_21_20   = 0x04,  /**< 加速度21Hz/8.5ms, 陀螺仪20Hz/8.3ms */
    DLPF_10_10   = 0x05,  /**< 加速度10Hz/13.8ms,陀螺仪10Hz/13.4ms */
    DLPF_5_5     = 0x06   /**< 加速度5Hz/19.0ms, 陀螺仪5Hz/18.6ms */
};

/* ============================================================
 * 数据结构定义
 * ============================================================ */

/** 三轴加速度数据（单位：g，重力加速度） */
struct AccelData {
    float x;   /**< X 轴加速度 (g) */
    float y;   /**< Y 轴加速度 (g) */
    float z;   /**< Z 轴加速度 (g) */
};

/** 三轴角速度（陀螺仪）数据（单位：°/s） */
struct GyroData {
    float x;   /**< X 轴角速度 (°/s) */
    float y;   /**< Y 轴角速度 (°/s) */
    float z;   /**< Z 轴角速度 (°/s) */
};

/** 校准偏移量（原始 LSB 值，运行时软件减去） */
struct CalibrationOffsets {
    int16_t ax;   /**< 加速度 X 偏移 (LSB) */
    int16_t ay;   /**< 加速度 Y 偏移 (LSB) */
    int16_t az;   /**< 加速度 Z 偏移 (LSB，含重力分量，校准时扣除 1g) */
    int16_t gx;   /**< 陀螺仪 X 偏移 (LSB) */
    int16_t gy;   /**< 陀螺仪 Y 偏移 (LSB) */
    int16_t gz;   /**< 陀螺仪 Z 偏移 (LSB) */
};

/** 驱动初始化参数 */
struct MPU6050Config {
    uint8_t i2cAddress;          /**< I2C 设备地址，默认 MPU6050_ADDR_LOW */
    int sdaPin;                  /**< I2C SDA 引脚（XIAO ESP32C3 默认 D4=GPIO6） */
    int sclPin;                  /**< I2C SCL 引脚（XIAO ESP32C3 默认 D5=GPIO7） */
    uint32_t i2cFreq;            /**< I2C 频率 (Hz)，建议 400000 */
    AccelFullScale accelFS;      /**< 加速度量程 */
    GyroFullScale gyroFS;        /**< 陀螺仪量程 */
    uint8_t sampleRateDiv;       /**< 采样率分频值，采样率=1kHz/(1+该值) */
    DLPFCfg dlpf;                /**< 数字低通滤波配置 */
};

/* ============================================================
 * MPU6050Driver 驱动类
 * ============================================================ */
class MPU6050Driver {
public:
    /**
     * @brief 构造函数，使用默认配置
     */
    MPU6050Driver();

    /**
     * @brief 带配置参数的构造函数
     * @param cfg 初始化参数结构体
     */
    explicit MPU6050Driver(const MPU6050Config &cfg);

    /**
     * @brief 初始化传感器：I2C、复位、唤醒、配置量程/采样率/DLPF
     * @param autoDetect true=自动探测地址(0x68/0x69)与I2C频率(400k/100k); false=使用_cfg中给定值
     * @return true 初始化成功；false 失败（通常为未检测到设备）
     */
    bool begin(bool autoDetect = true);

    /**
     * @brief I2C 总线扫描：将总线上所有响应的设备地址打印到串口
     * @param out 打印目标（默认 Serial）
     */
    void scanI2CBus(Print &out = Serial);

    /** @brief 获取实际生效的 I2C 设备地址 */
    uint8_t getActiveAddress() const { return _activeAddr; }

    /** @brief 获取实际生效的 I2C 频率 (Hz) */
    uint32_t getActiveI2CFreq() const { return _activeFreq; }

    /** @brief 获取最后一次读取的 WHO_AM_I 值 */
    uint8_t getLastWHO_AM_I() const { return _lastWhoAmI; }

    /**
     * @brief 执行传感器校准
     * @details 校准期间需保证设备静止平放（Z 轴受重力，期望 1g），
     *          驱动会采集 calibrationSamples 个样本求平均得到偏移量，
     *          并保存到内存中，后续读取时自动减去。
     *          校准默认耗时约 2~3 秒（取决于样本数与采样率）。
     * @param calibrationSamples 采样样本数，建议 512~2048
     * @return true 校准完成；false 校准失败
     */
    bool calibrate(uint16_t calibrationSamples = 1024);

    /**
     * @brief 读取加速度数据（单位 g，已应用校准偏移）
     * @param[out] outAccel 输出加速度数据
     * @return true 读取成功；false I2C 通信失败
     */
    bool readAcceleration(AccelData &outAccel);

    /**
     * @brief 读取陀螺仪角速度数据（单位 °/s，已应用校准偏移）
     * @param[out] outGyro 输出角速度数据
     * @return true 读取成功；false I2C 通信失败
     */
    bool readGyroscope(GyroData &outGyro);

    /**
     * @brief 一次性读取六轴数据（加速度 + 陀螺仪），减少 I2C 开销
     * @param[out] outAccel 加速度输出
     * @param[out] outGyro  角速度输出
     * @return true 读取成功；false I2C 通信失败
     */
    bool readMotion6(AccelData &outAccel, GyroData &outGyro);

    /**
     * @brief 读取芯片温度（单位 °C）
     * @param[out] outTemp 温度输出
     * @return true 读取成功；false I2C 通信失败
     */
    bool readTemperature(float &outTemp);

    /**
     * @brief 读取 WHO_AM_I 寄存器，验证设备身份
     * @return WHO_AM_I 寄存器值；通信失败返回 0x00
     */
    uint8_t whoAmI();

    /**
     * @brief 获取当前配置
     * @return 配置结构体引用
     */
    const MPU6050Config &getConfig() const { return _cfg; }

    /**
     * @brief 获取当前校准偏移量
     * @return 校准偏移量结构体
     */
    const CalibrationOffsets &getOffsets() const { return _offsets; }

    /**
     * @brief 是否已完成校准
     * @return true 已校准
     */
    bool isCalibrated() const { return _calibrated; }

private:
    /**
     * @brief 向指定寄存器写入单字节
     * @return true 成功；false 失败
     */
    bool writeRegister(uint8_t reg, uint8_t value);

    /**
     * @brief 从指定寄存器读取单字节
     * @param[out] value 读取结果
     * @return true 成功；false 失败
     */
    bool readRegister(uint8_t reg, uint8_t &value);

    /**
     * @brief 从指定寄存器连续读取多字节
     * @param reg 起始寄存器地址
     * @param buffer 输出缓冲区
     * @param length 读取字节数
     * @return true 成功；false 失败
     */
    bool readRegisters(uint8_t reg, uint8_t *buffer, uint8_t length);

    /**
     * @brief 将两个字节组合为有符号 16 位整数（大端序，MPU6050 数据为大端）
     */
    static int16_t toInt16(uint8_t high, uint8_t low) {
        return (int16_t)((high << 8) | low);
    }

    /**
     * @brief 使用指定的地址和频率进行一次完整初始化尝试
     * @return true 成功；false 失败
     */
    bool tryInitAt(uint8_t addr, uint32_t freq);

    /**
     * @brief 应用配置到传感器寄存器（量程、采样率、DLPF）
     * @return true 成功；false 失败
     */
    bool applyConfig();

    /**
     * @brief 根据当前量程计算加速度灵敏度（LSB/g）
     */
    float accelSensitivity() const;

    /**
     * @brief 根据当前量程计算陀螺仪灵敏度（LSB/°/s）
     */
    float gyroSensitivity() const;

    MPU6050Config _cfg;             /**< 当前配置 */
    CalibrationOffsets _offsets;    /**< 校准偏移量 */
    bool _calibrated;               /**< 是否已校准 */
    uint8_t  _activeAddr;           /**< 实际生效的 I2C 设备地址 */
    uint32_t _activeFreq;           /**< 实际生效的 I2C 频率 (Hz) */
    uint8_t  _lastWhoAmI;           /**< 最后一次读取的 WHO_AM_I 值 */
};

#endif // MPU6050_DRIVER_H
