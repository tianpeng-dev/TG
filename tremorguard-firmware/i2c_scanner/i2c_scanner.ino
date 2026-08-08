/**
 * @file i2c_scanner.ino
 * @brief I2C 总线扫描诊断工具 —— 查找总线上所有 I2C 设备及其地址
 * @hardware Seeed Studio XIAO ESP32C3
 *
 * @details
 * 当 MPU6050 无法被检测到时，先运行此扫描器确认：
 *   1. I2C 接线是否正确（SDA→D4, SCL→D5）
 *   2. 设备实际 I2C 地址是多少（0x68 或 0x69）
 *   3. 是否有任何设备在总线上
 *
 * 使用方法：
 *   1. 在 Arduino IDE 中打开此文件
 *   2. 选择 XIAO_ESP32C3 开发板和对应端口
 *   3. 上传后打开串口监视器（115200 波特率）
 *   4. 查看扫描结果
 */

#include <Wire.h>

// XIAO ESP32C3 I2C 引脚
#define I2C_SDA_PIN   6   // D4 = GPIO6
#define I2C_SCL_PIN   7   // D5 = GPIO7
#define I2C_FREQ      400000

void setup() {
    Serial.begin(115200);
    delay(2000);  // 等待串口就绪

    Serial.println();
    Serial.println(F("============================================"));
    Serial.println(F("  I2C Bus Scanner - XIAO ESP32C3"));
    Serial.println(F("============================================"));
    Serial.print  (F("  SDA: D4 (GPIO")); Serial.print(I2C_SDA_PIN); Serial.println(F(")"));
    Serial.print  (F("  SCL: D5 (GPIO")); Serial.print(I2C_SCL_PIN); Serial.println(F(")"));
    Serial.print  (F("  Freq: "));        Serial.print(I2C_FREQ);    Serial.println(F(" Hz"));
    Serial.println(F("============================================"));
    Serial.println();
}

void loop() {
    Serial.println(F("[SCAN] 开始扫描 I2C 总线 (地址 0x01 ~ 0x7F)..."));

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, I2C_FREQ);

    uint8_t deviceCount = 0;

    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        uint8_t error = Wire.endTransmission();

        if (error == 0) {
            // 设备响应成功
            Serial.print  (F("  [FOUND] 设备检测到: 0x"));
            if (addr < 16) Serial.print(F("0"));
            Serial.print(addr, HEX);

            // 标注已知设备
            if (addr == 0x68 || addr == 0x69) {
                Serial.print(F("  <-- MPU6050"));
                if (addr == 0x68) Serial.print(F(" (AD0=GND)"));
                else              Serial.print(F(" (AD0=HIGH)"));
            }
            Serial.println();
            deviceCount++;
        }
    }

    Serial.println();
    Serial.print  (F("[SCAN] 扫描完成，检测到 "));
    Serial.print  (deviceCount);
    Serial.println(F(" 个设备"));

    if (deviceCount == 0) {
        Serial.println();
        Serial.println(F("[ERROR] 未检测到任何 I2C 设备！请检查："));
        Serial.println(F("  1. SDA 是否接到 D4 (GPIO6)"));
        Serial.println(F("  2. SCL 是否接到 D5 (GPIO7)"));
        Serial.println(F("  3. VCC 是否接到 3V3"));
        Serial.println(F("  4. GND 是否接到 GND"));
        Serial.println(F("  5. USB 数据线是否支持数据传输"));
    }

    Serial.println();
    Serial.println(F("--------------------------------------------"));
    Serial.println(F("5 秒后重新扫描..."));
    Serial.println();
    delay(5000);
}
