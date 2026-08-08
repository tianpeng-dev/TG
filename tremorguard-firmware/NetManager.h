/**
 * @file NetManager.h
 * @brief TremorGuard 网络管理器 —— SoftAP 配网 + STA 恢复
 *
 * 功能：
 *   1. 上电从 NVS 命名空间 "tremorguard_net" 读取 WiFi/服务器配置
 *   2. 非阻塞 STA 连接；失败/未配网时自动进入 SoftAP 配网模式
 *   3. SoftAP 下同时开 Captive Portal（WebServer+DNSServer）提供配网网页
 *   4. 仅当 STA 连接验证成功后才原子写入 NVS，失败保留原凭证
 *   5. 全程非阻塞，100Hz 传感器采样不会因网络处理中断
 *
 * @note XIAO ESP32C3 + Arduino ESP32 3.0.x
 */
#ifndef _NET_MANAGER_H_
#define _NET_MANAGER_H_

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ====== 可调参数 ======
#define STA_CONNECT_TIMEOUT_MS    15000UL   // 单次 STA 连接超时
#define STA_MAX_ATTEMPTS          3         // 自动恢复阶段最大尝试次数
#define SOFTAP_MAX_ATTEMPTS       2         // 配网提交验证的尝试次数
#define NET_NVS_NAMESPACE         "tremorguard_net"  // NVS 命名空间
#define AP_IP_0                   192       // SoftAP IP: 192.168.4.1
#define AP_IP_1                   168
#define AP_IP_2                   4
#define AP_IP_3                   1
// =====================

/**
 * @brief 网络管理器状态
 */
enum NetState : uint8_t {
    NET_CHECK = 0,   // 初始化中：读取 NVS 并决定下一步
    STA_CONN  = 1,   // STA 连接中（自动恢复阶段）
    STA_OK    = 2,   // STA 已连接，正常工作
    SOFTAP    = 3,   // SoftAP 配网模式（Captive Portal 开启）
};

/**
 * @brief 临时 STA 验证阶段的结果（用于配网提交）
 */
enum TempStaPhase : uint8_t {
    TEMP_IDLE = 0,       // 无正在进行的验证
    TEMP_CONNECTING = 1, // 正在验证连接
    TEMP_SUCCESS  = 2,   // 验证成功（已写入 NVS/已关 SoftAP 或即将关闭）
    TEMP_FAILED   = 3,   // 验证失败
};

/**
 * @brief 网络配置（用于 NVS 读取与网页提交暂存）
 */
struct NetConfig {
    String  ssid;        // WiFi SSID（1-32 字符）
    String  password;    // WiFi 密码（空=开放网络；加密网络 8-63）
    String  serverUrl;   // 服务器地址：http(s)://host[:port][/path]
    uint8_t provisioned; // 0=未配网 / 1=已完成配网
};

/**
 * @brief SoftAP 配网网络管理器
 */
class NetManager {
public:
    NetManager();

    /**
     * @brief 初始化（setup 中调用一次）：
     *        读取 MAC 生成短码 -> 读取 NVS -> 进入 NET_CHECK
     */
    void begin();

    /**
     * @brief 非阻塞状态机推进（主 loop 最前面调用，不 delay 不阻塞）
     * @param nowMs 当前 millis()，由主 loop 统一传入以避免重复调用
     */
    void loop(uint32_t nowMs);

    // ===== 查询接口 =====
    NetState     getState()     const { return _state; }
    bool         isConfigured() const { return _saved.provisioned == 1; }
    const NetConfig& getSavedConfig() const { return _saved; }   // NVS 中保存的配置
    const NetConfig& getPendingConfig() const { return _pending; } // 配网验证中配置
    IPAddress    getStaIP()     const { return WiFi.localIP(); }
    IPAddress    getApIP()      const { return _apIP; }
    const String& getApSSID()   const { return _apSSID; }
    String       getApSSIDShort() const { return _devShort; }   // 设备短码

    /**
     * @brief 追加网络状态摘要到串口（人类可读一行）
     * @param out 输出流，一般为 Serial
     */
    void printStatusLine(Print &out) const;

private:
    // ===== 核心状态 =====
    NetState   _state;
    NetConfig  _saved;      // 从 NVS 读取的已保存配置（只读，除非 STA 验证成功）
    NetConfig  _pending;    // 配网页面提交待验证配置（仅 TempStaPhase!=IDLE 时有效）

    // ===== STA 连接阶段状态（自动恢复阶段）=====
    uint32_t _staStartMs;
    uint32_t _staLastPrintMs;
    uint8_t  _staAttempts;

    // ===== SoftAP / Captive Portal =====
    String      _devShort;   // 设备短码：MAC 后 3 字节 HEX，6 字符
    String      _apSSID;     // TremorGuard-<短码>
    IPAddress   _apIP;       // 192.168.4.1
    IPAddress   _apSubnet;   // 255.255.255.0
    DNSServer   _dnsServer;
    WebServer  *_pWebServer; // 动态分配（避免头文件依赖全局构造顺序）

    // ===== 临时 STA 验证阶段（配网提交验证）=====
    TempStaPhase _tempPhase;
    uint32_t _tempStartMs;
    uint32_t _tempFinishAt;     // TEMP_SUCCESS 后关闭 SoftAP 的时刻（留 1.5s 给前端读 /status）
    uint32_t _tempRetryAt;      // 快速失败后等 2s 再 retry 的目标时刻（0=不等待）
    uint8_t  _tempAttempts;
    int      _tempLastStatus;   // 最近一次 WiFi.status() 快照（给前端）
    String   _tempFailReason;   // 失败原因字符串（WRONG_PASSWORD / SSID_NOT_FOUND / TIMEOUT / OTHER）

    // ===== 内部函数 =====
    // NVS
    void _loadNVS();                     // 读取 _saved 从 tremorguard_net
    bool _saveToNVS(const NetConfig &c); // 原子保存：最后写 provisioned=1
    void _clearProvisioned();            // 清 provisioned 标志，保留其它字段

    // 通用 STA
    bool _validateConfigFormat(const NetConfig &c, String &errMsg /*out*/) const;
    void _tryStaConnect(const char *ssid, const char *password);

    // 状态分支实现
    void _stepNetCheck(uint32_t now);
    void _stepStaConn(uint32_t now);
    void _stepStaOk(uint32_t now);
    void _stepSoftAp(uint32_t now);

    // SoftAP
    void _startSoftAP();
    void _stopSoftAP();
    void _setupWebRoutes();              // 注册 HTTP 路由
    void _handleCaptivePortalTick();     // dns + server.handleClient

    // HTTP handlers（均为短处理，无 delay）
    void _hRoot();
    void _hScan();
    void _hSave();
    void _hStatus();

    // 工具
    static String _encryptionStr(wifi_auth_mode_t t);
};

#endif /* _NET_MANAGER_H_ */
