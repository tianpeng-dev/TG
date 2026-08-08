# TremorGuard SoftAP 配网功能开发计划

## 一、用户需求回顾

为 XIAO ESP32C3 固件新增 SoftAP 模式网络配置功能（基于 Arduino ESP32 3.0.x 内核）：

1. **NVS 启动恢复**：上电时从命名空间 `tremorguard_net` 读取已保存的 SSID/密码/服务器地址，尝试 STA 连接
2. **失败自动进入配网**：未配置或多次连接失败时，开启热点 `TremorGuard-<设备短码>`，IP 固定 `192.168.4.1`
3. **Web 配网界面**：SoftAP 运行 `WebServer + DNSServer`（捕获门户 / captive portal），提供填写 SSID/密码/服务器地址的网页表单并校验
4. **原子写入 NVS**：**验证成功连接后才写入 NVS 并关闭配网入口**；连接失败保留原有凭证
5. **四项测试场景**：断电重启恢复 / 错误密码处理 / 连接超时策略 / 配网期间采样不中断

参考文档：`https://wiki.seeedstudio.com/cn/XIAO_ESP32C3_WiFi_Usage/`（STA 模式 `WiFi.begin(ssid, pass)` + `while(status != WL_CONNECTED)`；SoftAP 模式 `WiFi.softAP(ssid, pass)` + `WiFi.softAPIP()` 固定返回 192.168.4.1；Arduino 3.x 注意 `softAPIPv6()` → `softAPlinkLocalIPv6()`）

---

## 二、现有代码分析（Repo Research Conclusion）

### 2.1 现有文件结构
- `tremorguard-firmware/tremorguard-firmware.ino` — 主程序（setup/loop、100Hz 采样 + 1Hz 窗口聚合输出、MPU6050 初始化与诊断）
- `tremorguard-firmware/MPU6050Driver.h/.cpp` — MPU6050 驱动（不改动）
- `tremorguard-firmware/README.md` — 接线/烧录说明（需要更新 WiFi 配网章节）

### 2.2 现有 loop 结构与"采样不中断"约束
现有 `loop()` 采用**非阻塞式两层状态机**：
- 第 1 层：每 `SAMPLE_INTERVAL_MS=10ms` 采样一次（100Hz）
- 第 2 层：每 `OUTPUT_INTERVAL_MS=1000ms` 打印一次窗口报告（1Hz）

这是**天然非阻塞**结构，没有 `delay()` 长等待。WiFi/SoftAP/WebServer 逻辑必须遵循同样模式——**所有可能耗时的操作（WiFi.begin、WebServer.handleClient、DNS）都必须在 loop 中轮询调用，不得阻塞采样计时器**。

### 2.3 可用库（Arduino ESP32 3.0.x 内核自带，无需第三方）
- `<WiFi.h>` — `WiFi.mode(WIFI_STA/WIFI_AP_STA)` + `WiFi.begin/softAP/status/localIP/softAPIP`
- `<WebServer.h>` — `WebServer server(80)` + `server.on/handleClient/send_P`
- `<DNSServer.h>` — `DNSServer dnsServer` + `dnsServer.start(53, "*", apIP)`（Captive Portal 所有域名 → 192.168.4.1）
- `<Preferences.h>` — NVS 键值存储：`Preferences prefs` + `prefs.begin("tremorguard_net", true/false)` + `putString/getString/clear/remove`

---

## 三、整体架构设计

### 3.1 状态机（避免阻塞，支持采样并行）

```
      +-----------+  读NVS成功  +-----------+  连接成功(<=N次)  +-------------+
      | NET_CHECK | ----------->| STA_CONN  |------------------>| STA_RUNNING |
      +-----------+             +-----------+                    +-------------+
           | 无配置/重置               |  N次失败/超时
           |                          v
           |                     +----------+
           +-------------------->| SOFTAP   |
                                 +----------+
                                 WebServer + DNSServer
                                 用户提交表单 -> 临切换STA测试连接
                                         |
                          +--------------+--------------+
                          | 成功                        | 失败
                          v                             v
                 写入NVS + 关SoftAP             返回SOFTAP + 提示错误
                 -> STA_RUNNING               (保留原NVS不变)
```

**四态枚举**：
| 状态 | 说明 |
|------|------|
| `NET_CHECK` | setup 时从 NVS 读取配置，有有效 SSID 则进入 STA_CONN；否则直接进入 SOFTAP |
| `STA_CONN` | 非阻塞轮询 WiFi 状态，带超时与失败次数计数 |
| `STA_RUNNING` | STA 已连接，loop 中监听断连事件 |
| `SOFTAP` | 开热点 + captive portal，处理 HTTP 请求 |

### 3.2 NVS 命名空间 `tremorguard_net`
| Key | 类型 | 含义 |
|-----|------|------|
| `ssid`      | String | WiFi SSID（长度 1-32） |
| `password`  | String | WiFi 密码（长度 0 表示开放网络；加密网络 >=8） |
| `server_url`| String | 服务器地址（IP 或 Host，可选端口），如 `http://192.168.1.100:8080` |
| `provisioned` | UChar | `1`=已完成配网；缺失或 `0`=未配网 |

### 3.3 设备短码
取芯片 MAC 地址后 3 字节 Hex（6 字符），形成 `TremorGuard-A1B2C3`。这样用户多设备时可区分，且无需 EEPROM/额外配置。

---

## 四、修改文件与模块

### 4.1 新增文件：`tremorguard-firmware/NetManager.h`
网络管理器头文件，声明：
- 四态枚举 `NetState { NET_CHECK, STA_CONN, STA_RUNNING, SOFTAP }`
- 配置结构体 `NetConfig { ssid, password, serverUrl, provisioned }`
- 类 `NetManager`：
  - `begin()` — 初始化，读取 NVS 进入 NET_CHECK
  - `loop()` — **非阻塞**状态机推进（必须每主循环调用，不阻塞采样）
  - `getState() / isConfigured() / getConfig() / getStaIP()` — 查询
  - 内部私有：
    - `loadFromNVS() / saveToNVS() / clearNVSProvisioned()`
    - `tryStaConnectNonBlocking(ssid, pass)`
    - `startSoftAP() / stopSoftAP()`
    - `setupWebServerRoutes()` — 根页面 / 提交页 / 扫描 API
    - `handleCaptivePortal()` — DNSServer 轮询 + WebServer.handleClient()

### 4.2 新增文件：`tremorguard-firmware/NetManager.cpp`
实现以上逻辑。核心注意事项见下节。

### 4.3 修改文件：`tremorguard-firmware/tremorguard-firmware.ino`
- 新增 `#include "NetManager.h"`，创建全局 `NetManager net;`
- 在 `setup()` 中 Banner 之后、MPU6050 初始化（含重试循环）**之前**调用 `net.begin()`
- 在 `loop()` 开头（采样层之前）调用 `net.loop()`——位置放最前面，保证网络事件不被采样延迟拖垮
- 在串口报告中追加一行网络状态（STA IP 或 SoftAP SSID + IP），便于用户确认

### 4.4 修改文件：`tremorguard-firmware/README.md`
- 新增章节"八、WiFi 配网（SoftAP 模式）"：
  - 配网触发条件
  - 热点名/IP 说明
  - 网页表单字段与校验规则
  - 成功/失败提示
- 更新"文件结构"章节

---

## 五、实现步骤（详细）

### Step 1：实现 NetManager 基础（NVS 读写 + 设备短码）
1. 设备短码：`WiFi.macAddress()` → 取字符串后 8 位去掉 `:`，即后 3 字节 Hex
2. Preferences 使用：
   - `prefs.begin("tremorguard_net", false)` 读写模式 / `true` 只读模式
   - `String ssid = prefs.getString("ssid", "")`；`uint8_t prov = prefs.getUChar("provisioned", 0)`
   - 保存时按"原子语义"：先 `prefs.putString(ssid/password/server_url)`，最后 `putUChar("provisioned", 1)`；若中途失败则下一次 `provisioned==0`，视为未配网
   - 验证失败**不写入**：即仅当 `WiFi.status()==WL_CONNECTED` 后才调用 `saveToNVS`

### Step 2：STA_CONN 非阻塞连接 + 超时/重试策略
参考官方文档高级示例，但改为**无 delay 阻塞**：
- `NET_CHECK -> STA_CONN` 时调用 `WiFi.mode(WIFI_STA); WiFi.begin(cfg.ssid, cfg.password);`，记录 `staConnStartMs = millis()`，设置 `staConnAttempts = 0`
- 在 `STA_CONN` 状态的 loop 分支：
  - 每 100ms（通过时间戳判断，不 delay）根据 `WiFi.status()` 打印进度点
  - **超时 15 秒**仍未连接 → `staConnAttempts++`；`<STA_MAX_ATTEMPTS(3)` 则重新 WiFi.begin 再试；否则进入 SOFTAP
  - 状态细化：
    - `WL_NO_SSID_AVAIL`：SSID 不存在，无需等满 15s，立即计失败
    - `WL_CONNECT_FAILED`：密码错误 / 认证失败，立即计失败
    - `WL_CONNECTION_LOST`：已连上又掉线，本算一次尝试内重试一次再计失败
    - `WL_CONNECTED` → 若 NVS 与当前正在连接的临时配置**相同** → `STA_RUNNING`；**若为配网临时验证** → 保存到 NVS + stopSoftAP + `STA_RUNNING`

### Step 3：SoftAP 启动 + Captive Portal（WebServer + DNSServer）
- IP 固定：`IPAddress apIP(192,168,4,1); IPAddress subnet(255,255,255,0); WiFi.softAPConfig(apIP, apIP, subnet);`
- `WiFi.mode(WIFI_AP_STA)` — 关键：**同时开 AP+STA**，才能在用户提交表单后「原地」切换到 STA 验证连接，无需重启热点
- 热点：`WiFi.softAP(apSSID.c_str(), apPassword)`，**apPassword 为空=开放网络**（用户需求未要求密码，默认开放）
- DNSServer：`dnsServer.setTTL(300); dnsServer.start(53, "*", apIP);` — 所有域名 → 192.168.4.1（含 `captive.apple.com`、`connectivitycheck.gstatic.com`、`clients3.google.com` 等系统 CNA 探测域名）
- WebServer(80)：
  - `server.onNotFound([](){ server.sendHeader("Location","/",true); server.send(302,"text/plain",""); });` — 配合 DNSServer 形成 captive portal
  - `server.on("/", HTTP_GET, handleRootPage)` — 渲染配网 HTML
  - `server.on("/scan", HTTP_GET, handleScan)` — 异步 WiFi 扫描，返回 JSON 列表给前端下拉选择
  - `server.on("/save", HTTP_POST, handleSave)` — 接收表单，执行临时 STA 验证

### Step 4：配网页面 HTML（内置 PROGMEM）
单页响应式，中文界面，三个字段 + 连接按钮 + 状态区：
```
┌──────────────────────────────────────┐
│     TremorGuard 配网                 │
├──────────────────────────────────────┤
│ WiFi 名称 (SSID): [ ▼ 扫描列表    ] │
│ WiFi 密码:        [ 输入框       ]   │
│ 服务器地址:      [ http://...   ]    │
│                                      │
│    [ 开始连接 ]                       │
│                                      │
│ 状态: 等待输入...                    │
└──────────────────────────────────────┘
```
**前端校验**（JS 提交前 + 后端再校验双保险）：
- SSID：非空，长度 1-32
- 密码：空（开放网络）或 8-63 字符（WPA-PSK 长度规定）
- 服务器地址：非空，`^https?://` 前缀或合法 IP/Host:Port 格式（正则 `^https?://[A-Za-z0-9\-\.:/]+$`）

### Step 5：提交验证 + 原子写入 NVS（关键！）
`handleSave` 处理流程：
1. 读 SSID/password/serverUrl 参数，后端再校验一遍
   - 校验失败：返回 HTML 页面内嵌错误消息（红色），字段值回填（password 除外，填 `••••••••`），HTTP 200
2. 校验通过：
   - 记录 `pendingCfg`
   - 先 `WiFi.disconnect(true); WiFi.mode(WIFI_AP_STA);`（保持 SoftAP 不关掉，这样用户手机不被踢掉线才能看到结果）
   - `WiFi.begin(pendingCfg.ssid, pendingCfg.password)` 开始连接
   - **不能用阻塞 while**：返回一个 HTML「正在连接…自动刷新」页面（meta refresh 3s），页面中 JS 拉 `/status` JSON
3. 新增 `/status` 路由：返回临时 STA 连接状态 JSON
   ```json
   {"phase":"connecting","attempts":1,"elapsedSec":3,"statusCode":6}
   // 最终
   {"phase":"success","ip":"192.168.1.55","msg":"连接成功，正在保存配置…"}
   {"phase":"failed","reason":"WRONG_PASSWORD|SSID_NOT_FOUND|TIMEOUT","msg":"…"}
   ```
4. `/status` 内部同样走非阻塞状态机（使用独立的 `tempStaStartMs`、`tempStaAttempts` 计数器，在 `NetManager::loop()` 的 `SOFTAP` 分支顺带轮询）
5. 成功回调：
   - **先** `saveToNVS(pendingCfg)`（写入 NVS + provisioned=1）
   - **再** `stopSoftAP()`（关闭 DNSServer、WiFi.softAPdisconnect、切 mode 回 WIFI_STA）
   - 进入 `STA_RUNNING`
6. 失败回调：
   - `WiFi.disconnect()` 释放临时 STA 尝试
   - **NVS 完全不动**，保留原有凭证
   - `/status` 返回 `phase=failed`，前端展示错误原因 + 「返回修改」按钮

### Step 6：loop 中与采样的非阻塞整合
主 `loop()` 顺序：
```
void loop() {
  uint32_t now = millis();
  net.loop(now);            // ① 网络状态机（最轻量：DNS/HTTP/STA轮询，<5ms）
  if (采样计时器到期)       // ② 100Hz 采样（1ms以内I2C读）
  if (输出计时器到期)       // ③ 1Hz 打印报告
}
```
**采样不中断证明**：以上三层均用 `now - lastX >= INTERVAL` 的时间戳判断，没有 `delay()`。`net.loop()` 单次调用耗时来自 `dnsServer.processNextRequest()`（<1ms，仅当有 DNS 请求时）与 `server.handleClient()`（<3ms，HTTP 请求时，其余 0）与 WiFi 状态读取（<0.1ms）。三者之和 <5ms，SAMPLE_INTERVAL=10ms 仍然准时到点——采样被延迟不超过 5ms、不丢采样节拍。

### Step 7：四场景自测代码埋点（打印 + 触发方式）
| 场景 | 触发方式 | 验证打印 |
|------|----------|----------|
| 断电重启恢复 | 写入 NVS 后，在 `[NET] 从 NVS 读取成功 ssid=XXX` → 复位板 → 观察是否跳过配网自动 STA 连上 | `[NET] 启动恢复：已保存 ssid=XXX，连接成功 IP=…` |
| 错误密码 | 配网输入错误密码 | `/status` → `reason:"WRONG_PASSWORD"`，NVS 保持旧值不变，不关闭 SoftAP |
| 连接超时 | 连不存在的 SSID | 15s 超时 → `reason:"TIMEOUT"` |
| 配网时采样不中断 | 配网页面停留 30s，观察串口 1Hz 报告 | 报告一直每秒输出一份（无丢秒、无暂停），报告尾显示 `[NET] SoftAP: TremorGuard-XXXX IP=192.168.4.1` |

---

## 六、依赖与兼容性

### 6.1 Arduino ESP32 3.0.x API 差异
根据官方文档：
- `softAPIPv6()` 在 3.x 改为 `softAPlinkLocalIPv6()` — 本项目不使用 IPv6，不受影响
- `WiFi.encryptionType()` 返回值在 3.x 加了 WPA3 — `/scan` JSON 统一输出字符串描述，不比较枚举
- `WiFi.mode()` / `WiFi.begin()` / `WiFi.softAP()` / `WiFi.softAPConfig()` — 3.x 与 2.x 兼容，直接使用

### 6.2 Preferences 注意
- `Preferences` 对象不跨 `begin()` 复用；多次开关需要 `end()` 再 `begin()`
- NVS 写入不是无限次（100k 次级别）；**只有 STA_CONNECTED 才写入**，用户不会触发过量写入

### 6.3 内存
- HTML 字符串用 `PROGMEM`（`const char INDEX_HTML[] PROGMEM = R"rawliteral(...)rawliteral";`），不占堆
- WiFi.scanNetworks 结果及时 `WiFi.scanDelete()` 释放

---

## 七、风险与处理

| 风险 | 后果 | 处理 |
|------|------|------|
| `/save` 验证期间长时间占用 server client，触发 WDT 或采样丢节拍 | 采样中断 | 改为立即返回 meta-refresh 页面 + 轮询 `/status`，不在 handleClient 中做长等待 |
| 配网期间连续多次 `/scan` 扫描网络，导致 STA 临时连接被打断 | 提交后连不上 | 提交前先 `WiFi.scanDelete()`；STA connecting 状态下禁止再扫描 |
| Captive Portal 部分手机（国内安卓）不自动弹浏览器 | 用户找不到页面 | HTML 页面提示「若无弹窗请手动访问 192.168.4.1」+ 在 SSID 广播名上也写清楚 IP |
| 用户提交后手机被踢出 SoftAP 看不到成功/失败结果 | 体验差 | 验证期间 `WIFI_AP_STA` 双模式保持，不关闭 SoftAP；只有 NVS 写入成功后才关 |
| STA 连接成功但服务器地址非法（未 DNS/未连通） | 配网写入了坏数据 | **本期仅做格式校验**；后端连通性属于后续 MQTT/HTTP 上报阶段再测 |
| NVS 写一半断电导致 provisioned=0 但有残留 ssid | 下次启动误以为未配网 | 正常：provisioned 是"已完成配网"唯一判据，值缺失即走配网流程，不会有其他副作用 |

---

## 八、最终交付物

1. [新增] `tremorguard-firmware/NetManager.h` — 网络管理器头（状态机/NVS/配置结构）
2. [新增] `tremorguard-firmware/NetManager.cpp` — 网络管理器实现（STA 非阻塞连接 + SoftAP Captive Portal + 原子写 NVS）
3. [修改] `tremorguard-firmware/tremorguard-firmware.ino` — 接入 net.begin() / net.loop()，串口报告追加网络状态
4. [修改] `tremorguard-firmware/README.md` — 新增 WiFi 配网章节与字段说明
