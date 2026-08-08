/**
 * @file tremorguard-firmware.ino
 * @brief TremorGuard 震颤检测手环固件主程序
 * @hardware Seeed Studio XIAO ESP32C3 + MPU6050
 *
 * @details
 * 本固件功能：
 *   1. 初始化 MPU6050（I2C 通信、复位、唤醒、量程/采样率/DLPF 配置）
 *   2. 静止校准（计算陀螺仪零漂与加速度偏移）
 *   3. 100Hz 高频采样 + 5Hz 低频输出（窗口聚合，人类可读结构化报告）
 *
 * 输出格式（每 200ms 一次 = 5Hz，落在人眼可读区间）：
 *   - 时间戳（毫秒 + 秒）
 *   - 加速度/角速度 三轴的 均值(趋势) / 峰值(震颤幅度) / 最新值(实时姿态)
 *   - 震颤强度 = 三轴峰值向量和（核心震颤指标）
 *
 * 设计原理：
 *   采样与输出解耦：保持 100Hz 高频采样（不丢失 4-6Hz 震颤信号），
 *   但每 200ms 聚合一次窗口内的 ~20 个样本，输出均值+峰值+最新值，
 *   既降低串口滚动速度到 5Hz 人眼可读，又通过峰值/向量和保留震颤幅度信息。
 *
 * 适用环境：Arduino IDE + ESP32 Arduino 核心库（不依赖第三方库）
 */

#include "MPU6050Driver.h"
#include "NetManager.h"
#include <math.h>

/* ============================================================
 * 全局配置
 * ============================================================ */

// 串口波特率（XIAO ESP32C3 使用 USB-CDC 串口，波特率可任意但建议 115200）
#define SERIAL_BAUDRATE        115200

// === 频率参数（采样与输出解耦）===
// 后台采样间隔：10ms = 100Hz（满足震颤 4-6Hz 奈奎斯特定理，不丢失信号）
#define SAMPLE_INTERVAL_MS     10
// 串口输出间隔：1000ms = 1Hz（人类可读，每秒一份报告）
//   窗口内聚合约 100 个样本，输出 均值/峰值/最新值/震颤强度
#define OUTPUT_INTERVAL_MS     1000

// 传感器初始化失败时的重试间隔与最大重试次数
#define INIT_RETRY_INTERVAL_MS 2000
#define INIT_RETRY_MAX         10

// 全局驱动实例（使用默认配置：±4g / ±500°/s / 100Hz / DLPF_44_42）
MPU6050Driver mpu;

// 网络管理器（SoftAP 配网 + STA 自动恢复 + NVS 原子写入）
NetManager net;

// === 窗口聚合状态（每 OUTPUT_INTERVAL_MS 重置一次）===
uint32_t lastSampleTime = 0;   // 上次采样时刻（控制 100Hz 采样节奏）
uint32_t windowStartMs  = 0;   // 当前窗口起始时刻
uint16_t windowSamples  = 0;   // 当前窗口已采样本数
uint8_t  readFailCount  = 0;   // 当前窗口读取失败次数

// 加速度窗口累加器（求均值）+ 峰值（绝对值最大）+ 最新值
float axSum, aySum, azSum;
float axPeak, ayPeak, azPeak;   // 峰值 = 窗口内绝对值最大值
float axLatest, ayLatest, azLatest;

// 陀螺仪窗口累加器 + 峰值 + 最新值
float gxSum, gySum, gzSum;
float gxPeak, gyPeak, gzPeak;
float gxLatest, gyLatest, gzLatest;

// 上一次输出时刻，用于控制输出节奏
uint32_t lastOutputTime = 0;

/* ============================================================
 * setup() —— 上电初始化
 * ============================================================ */
void setup() {
    // 1. 初始化串口（XIAO ESP32C3 默认 USB-CDC Serial）
    Serial.begin(SERIAL_BAUDRATE);
    // 等待 USB 串口就绪（XIAO ESP32C3 通过 USB 连接时需要短暂等待主机识别）
    // 超时保护，避免未接 USB 时无限阻塞
    uint32_t serialWaitStart = millis();
    while (!Serial && (millis() - serialWaitStart < 2000)) {
        ; // 等待 USB CDC 连接建立
    }
    delay(100);

    Serial.println();
    Serial.println(F("============================================"));
    Serial.println(F("  TremorGuard 震颤检测手环固件"));
    Serial.println(F("  Hardware: XIAO ESP32C3 + MPU6050"));
    Serial.println(F("============================================"));

    // 2. 网络初始化（Banner 之后、传感器之前）
    //    读取 NVS → 恢复 STA / 失败自动进入 SoftAP 配网（非阻塞，采样不中断）
    net.begin();

reInitFromStart:  // 初始化失败每 5 秒重试时跳回此处（避免重复执行 Serial.begin 导致 USB CDC 断开）
    (void)0;

    // 3. 传感器初始化（自动探测地址与频率）
    //    begin(true) 会依次尝试：地址(用户配置, 另一个) × 频率(用户配置, 100k)，共 4 种组合
    Serial.println(F("[INIT] 正在初始化 MPU6050（自动探测地址 0x68/0x69 + 频率 400k/100k）..."));
    bool initialized = mpu.begin(true);

    if (initialized) {
        Serial.println(F("[INIT] 初始化成功！"));
        // 4. 打印当前配置（实际生效的地址/频率）
        const MPU6050Config &cfg = mpu.getConfig();
        Serial.println(F("[CFG] 当前传感器配置:"));
        Serial.print  (F("      实际 I2C 地址: 0x"));  Serial.print(mpu.getActiveAddress(), HEX);
        if (mpu.getActiveAddress() == MPU6050_ADDR_LOW)  Serial.print(F(" (AD0=GND)"));
        if (mpu.getActiveAddress() == MPU6050_ADDR_HIGH) Serial.print(F(" (AD0=HIGH)"));
        Serial.println();
        Serial.print  (F("      实际 I2C 频率: "));    Serial.print(mpu.getActiveI2CFreq()); Serial.println(F(" Hz"));
        Serial.print  (F("      SDA 引脚: GPIO"));     Serial.print(cfg.sdaPin); Serial.println(F(" (D4)"));
        Serial.print  (F("      SCL 引脚: GPIO"));     Serial.print(cfg.sclPin); Serial.println(F(" (D5)"));
        Serial.print  (F("      采样率: "));            Serial.print(1000 / (1 + cfg.sampleRateDiv)); Serial.println(F(" Hz"));
        Serial.print  (F("      加速度量程: ±"));       Serial.print(2 << (cfg.accelFS >> 3)); Serial.println(F("g"));
        Serial.print  (F("      陀螺仪量程: ±"));       Serial.print(250 << (cfg.gyroFS >> 3)); Serial.println(F("°/s"));
        Serial.print  (F("      DLPF 配置: 0x"));        Serial.println((uint8_t)cfg.dlpf, HEX);

        // 5. 读取并打印设备 ID（二次确认通信正常）
        Serial.print(F("[ID] WHO_AM_I = 0x"));
        uint8_t id = mpu.getLastWHO_AM_I();
        if (id < 16) Serial.print(F("0"));
        Serial.print(id, HEX);
        if (id == WHO_AM_I_MPU6050) Serial.print(F(" (原装 MPU6050)"));
        else                        Serial.print(F(" (兼容/替代模块)"));
        Serial.println();
    } else {
        // 初始化失败：输出完整诊断信息，然后每 5 秒重试一次，不再反复重启
        Serial.println(F("[ERROR] 所有地址/频率组合均初始化失败。"));
        Serial.print  (F("[ERROR] 最后一次 WHO_AM_I 读出: 0x"));
        uint8_t lid = mpu.getLastWHO_AM_I();
        if (lid < 16) Serial.print(F("0"));
        Serial.println(lid, HEX);
        if (lid == 0x00) Serial.println(F("         → 0x00 = 总线上没有设备响应，请检查接线与供电"));
        if (lid == 0xFF) Serial.println(F("         → 0xFF = I2C 数据线可能被拉高短路/SDA SCL 接反"));

        // 立即自动扫描 I2C 总线，找出问题原因
        Serial.println();
        mpu.scanI2CBus(Serial);

        Serial.println();
        Serial.println(F("------------------------------------------------------------"));
        Serial.println(F("[CHECKLIST] 排查建议："));
        Serial.println(F("  1. 若扫描到 0x68/0x69：地址/通信正常但读写失败，是模块兼容性，"));
        Serial.println(F("     下一轮会自动再次尝试（每 5 秒），一般能成功。"));
        Serial.println(F("  2. 若两个频率都扫不到任何设备："));
        Serial.println(F("     → 请确认 SDA 接 D4(GPIO6), SCL 接 D5(GPIO7)"));
        Serial.println(F("     → 请确认 VCC 接 3V3、GND 接 GND"));
        Serial.println(F("     → 请确认面包板/杜邦线是否导通（换线测试）"));
        Serial.println(F("     → 请确认 MPU6050 模块本身是否损坏"));
        Serial.println(F("  3. 若扫描到非 0x68/0x69 的其它地址："));
        Serial.println(F("     → 请确认模块是否真的是 MPU6050（某些外观相同但芯片是 QMI8658/MPU6500 等）"));
        Serial.println(F("------------------------------------------------------------"));
        Serial.flush();

        // 不重启，而是每 5 秒重试一次，方便用户一边调整接线一边观察串口
        Serial.println(F("[INFO] 5 秒后重新初始化..."));
        delay(5000);
        // 跳到 setup 开头重跑 —— 用 goto 避免修改大量代码结构
        goto reInitFromStart;
    }

    // 6. 传感器校准
    //    !!! 重要：校准期间必须将手环静止平放于桌面 !!!
    //    Z 轴朝上时受 +1g 重力，校准会自动扣除该重力分量
    Serial.println(F("[CAL] 开始校准，请保持设备静止平放 (约 2-3 秒)..."));
    delay(500);  // 给用户半秒反应时间
    uint32_t calStart = millis();
    bool calOk = mpu.calibrate(1024);
    uint32_t calDuration = millis() - calStart;

    if (calOk) {
        const CalibrationOffsets &off = mpu.getOffsets();
        Serial.print(F("[CAL] 校准完成 (耗时 "));
        Serial.print(calDuration);
        Serial.println(F(" ms)"));
        Serial.println(F("[CAL] 偏移量 (LSB):"));
        Serial.print  (F("      Accel: ax=")); Serial.print(off.ax);
        Serial.print  (F(" ay="));             Serial.print(off.ay);
        Serial.print  (F(" az="));             Serial.println(off.az);
        Serial.print  (F("      Gyro:  gx=")); Serial.print(off.gx);
        Serial.print  (F(" gy="));             Serial.print(off.gy);
        Serial.print  (F(" gz="));             Serial.println(off.gz);
    } else {
        // 校准失败不致命，使用零偏移继续运行，但精度会下降
        Serial.println(F("[WARN] 校准失败，将使用零偏移继续运行（精度可能下降）"));
    }

    // 7. 读取一次温度，确认传感器工作正常
    float temp;
    if (mpu.readTemperature(temp)) {
        Serial.print(F("[ENV] 芯片温度: "));
        Serial.print(temp, 2);
        Serial.println(F(" °C"));
    }

    // 8. 输出说明，并启动监测
    Serial.println();
    Serial.println(F("============================================================"));
    Serial.println(F("  开始实时监测（5Hz 输出 / 100Hz 采样 / 窗口统计）"));
    Serial.println(F("  字段说明：mean=均值(趋势) peak=峰值(震颤幅度) latest=最新值"));
    Serial.println(F("  震颤强度 = 三轴峰值向量和（核心震颤指标）"));
    Serial.println(F("============================================================"));
    Serial.flush();

    // 初始化窗口聚合状态
    lastSampleTime = millis();
    lastOutputTime = lastSampleTime;
    windowStartMs  = lastSampleTime;
    windowSamples  = 0;
    readFailCount  = 0;
    axSum = aySum = azSum = 0;
    gxSum = gySum = gzSum = 0;
    axPeak = ayPeak = azPeak = 0;
    gxPeak = gyPeak = gzPeak = 0;
}

/**
 * @brief 重置窗口聚合状态（每个 200ms 输出周期开始时调用）
 */
static inline void resetWindow() {
    windowStartMs = millis();
    windowSamples = 0;
    readFailCount = 0;
    axSum = aySum = azSum = 0;
    gxSum = gySum = gzSum = 0;
    axPeak = ayPeak = azPeak = 0;
    gxPeak = gyPeak = gzPeak = 0;
}

/**
 * @brief 将单个样本纳入窗口统计（累加 + 峰值更新 + 最新值记录）
 * @param accel 加速度样本
 * @param gyro  陀螺仪样本
 */
static inline void accumulateSample(const AccelData &accel, const GyroData &gyro) {
    // 累加求均值
    axSum += accel.x; aySum += accel.y; azSum += accel.z;
    gxSum += gyro.x;  gySum += gyro.y;  gzSum += gyro.z;
    // 峰值 = 窗口内绝对值最大
    if (fabsf(accel.x) > fabsf(axPeak)) axPeak = accel.x;
    if (fabsf(accel.y) > fabsf(ayPeak)) ayPeak = accel.y;
    if (fabsf(accel.z) > fabsf(azPeak)) azPeak = accel.z;
    if (fabsf(gyro.x)  > fabsf(gxPeak)) gxPeak = gyro.x;
    if (fabsf(gyro.y)  > fabsf(gyPeak)) gyPeak = gyro.y;
    if (fabsf(gyro.z)  > fabsf(gzPeak)) gzPeak = gyro.z;
    // 最新值
    axLatest = accel.x; ayLatest = accel.y; azLatest = accel.z;
    gxLatest = gyro.x;  gyLatest = gyro.y;  gzLatest = gyro.z;
    windowSamples++;
}

/**
 * @brief 输出窗口统计的人类可读结构化报告
 */
static void printWindowReport(uint32_t nowMs) {
    if (windowSamples == 0) {
        Serial.println(F("[WARN] 本窗口无有效样本（I2C 全部读取失败）"));
        return;
    }

    // 计算均值
    float axMean = axSum / windowSamples;
    float ayMean = aySum / windowSamples;
    float azMean = azSum / windowSamples;
    float gxMean = gxSum / windowSamples;
    float gyMean = gySum / windowSamples;
    float gzMean = gzSum / windowSamples;

    // 计算震颤强度 = 三轴峰值向量和（震颤检测核心指标）
    float accelTremor = sqrtf(axPeak * axPeak + ayPeak * ayPeak + azPeak * azPeak);
    float gyroTremor  = sqrtf(gxPeak * gxPeak + gyPeak * gyPeak + gzPeak * gzPeak);

    // 时间戳（毫秒 + 秒，便于人眼读取）
    Serial.println();
    Serial.print(F("--- T="));
    Serial.print(nowMs);
    Serial.print(F("ms ("));
    Serial.print(nowMs / 1000.0f, 1);
    Serial.print(F("s)  窗口="));
    Serial.print(OUTPUT_INTERVAL_MS);
    Serial.print(F("ms / "));
    Serial.print(windowSamples);
    Serial.print(F("样本"));
    if (readFailCount > 0) {
        Serial.print(F(" / 失败"));
        Serial.print(readFailCount);
    }
    Serial.println(F(" ---"));

    // 加速度表格
    Serial.println(F("加速度 (g)    |   X       Y       Z"));
    Serial.print  (F("  均值        | "));
    Serial.print(axMean,  3); Serial.print(F("  "));
    Serial.print(ayMean,  3); Serial.print(F("  "));
    Serial.println(azMean, 3);
    Serial.print  (F("  峰值        | "));
    Serial.print(axPeak,  3); Serial.print(F("  "));
    Serial.print(ayPeak,  3); Serial.print(F("  "));
    Serial.println(azPeak, 3);
    Serial.print  (F("  最新        | "));
    Serial.print(axLatest, 3); Serial.print(F("  "));
    Serial.print(ayLatest, 3); Serial.print(F("  "));
    Serial.println(azLatest, 3);

    // 陀螺仪表格
    Serial.println(F("角速度 (°/s)  |   X       Y       Z"));
    Serial.print  (F("  均值        | "));
    Serial.print(gxMean,  3); Serial.print(F("  "));
    Serial.print(gyMean,  3); Serial.print(F("  "));
    Serial.println(gzMean, 3);
    Serial.print  (F("  峰值        | "));
    Serial.print(gxPeak,  3); Serial.print(F("  "));
    Serial.print(gyPeak,  3); Serial.print(F("  "));
    Serial.println(gzPeak, 3);
    Serial.print  (F("  最新        | "));
    Serial.print(gxLatest, 3); Serial.print(F("  "));
    Serial.print(gyLatest, 3); Serial.print(F("  "));
    Serial.println(gzLatest, 3);

    // 震颤强度（核心指标）
    Serial.print  (F("震颤强度:  加速度峰值向量和 = "));
    Serial.print(accelTremor, 3);
    Serial.print  (F(" g   |   角速度峰值向量和 = "));
    Serial.print(gyroTremor, 3);
    Serial.println(F(" °/s"));
}

/* ============================================================
 * loop() —— 主循环：100Hz 高频采样 + 5Hz 低频输出（窗口聚合）
 *
 * 设计原理：
 *   - 采样层：每 SAMPLE_INTERVAL_MS(10ms=100Hz) 读取一次六轴数据
 *             并纳入窗口累加器（保留 4-6Hz 震颤信号，不丢失信息）
 *   - 输出层：每 OUTPUT_INTERVAL_MS(200ms=5Hz) 计算窗口统计并打印
 *             人类可读结构化报告，落在人眼舒适区 1-5Hz
 * ============================================================ */
void loop() {
    uint32_t now = millis();

    // --- 第 0 层：网络状态机（放在最前，避免被采样/输出延迟拖累） ---
    //     单次调用 <5ms：DNS/HTTP 轮询 + STA 状态读取；全部非阻塞，无 delay
    net.loop(now);

    // --- 第 1 层：100Hz 高频采样 ---
    if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        lastSampleTime = now;

        AccelData accel;
        GyroData  gyro;

        if (mpu.readMotion6(accel, gyro)) {
            // 成功：纳入窗口统计（累加 + 峰值 + 最新值）
            accumulateSample(accel, gyro);
        } else {
            // 失败：仅累计失败次数，不影响窗口内已有数据
            readFailCount++;
        }
    }

    // --- 第 2 层：1Hz 低频输出（窗口聚合报告） ---
    if (now - lastOutputTime >= OUTPUT_INTERVAL_MS) {
        lastOutputTime = now;

        // 输出本窗口统计报告（加速度/陀螺仪 均值/峰值/最新值 + 震颤强度）
        printWindowReport(now);

        // 追加网络状态摘要行（一行看清当前 STA/SoftAP 状况）
        net.printStatusLine(Serial);

        // 重置窗口，开始下一个周期
        resetWindow();
    }
}
