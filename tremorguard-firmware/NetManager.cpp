/**
 * @file NetManager.cpp
 * @brief TremorGuard 网络管理器实现
 */
#include "NetManager.h"

/* ============================================================
 * 内置 HTML 资源（全部 PROGMEM，不占堆）
 * ============================================================ */

// 根页面：中文配网单页（三个字段 + 扫描 + 连接按钮 + 状态区）
static const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!doctype html><html lang=zh-CN><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>TremorGuard 配网</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",Arial,sans-serif;background:#f5f7fa;color:#1f2937}
.wrap{max-width:480px;margin:0 auto;padding:20px 16px 60px}
.hd{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:20px;border-radius:14px;box-shadow:0 6px 20px rgba(99,102,241,.25)}
.hd h1{margin:0 0 4px;font-size:20px}.hd p{margin:0;opacity:.9;font-size:13px}
.card{background:#fff;border-radius:14px;padding:18px;margin-top:16px;box-shadow:0 2px 10px rgba(16,24,40,.06)}
label{display:block;font-size:13px;color:#4b5563;margin:12px 0 6px;font-weight:600}
.input,.select{width:100%;padding:11px 12px;border:1px solid #d1d5db;border-radius:10px;font-size:15px;background:#fafafa;outline:none;transition:border .15s}
.input:focus,.select:focus{border-color:#6366f1;background:#fff}
.row{display:flex;gap:8px}.row .input{flex:1}
.btn{display:inline-flex;align-items:center;justify-content:center;width:100%;padding:13px;margin-top:18px;border:0;border-radius:10px;font-size:15px;font-weight:600;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,.3)}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn.ghost{background:#f3f4f6;color:#374151;box-shadow:none;border:1px solid #e5e7eb}
.err{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:13px;display:none}
.ok{margin-top:10px;padding:10px 12px;border-radius:10px;background:#ecfdf5;color:#065f46;font-size:13px;display:none}
.status{margin-top:14px;padding:12px;background:#f9fafb;border:1px dashed #d1d5db;border-radius:10px;font-size:13px;color:#4b5563;line-height:1.5}
.status .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;background:#eef2ff;color:#4338ca;margin-right:6px}
.tip{font-size:12px;color:#6b7280;margin-top:14px;line-height:1.6}
.kbd{display:inline-block;padding:2px 6px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;font-family:monospace;font-size:12px;color:#374151}
.bar{height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:10px;display:none}
.bar>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#6366f1,#a855f7);animation:bar 1.2s linear infinite}
@keyframes bar{0%{width:0}50%{width:60%}100%{width:100%}}
</style></head><body>
<div class=wrap>
<div class=hd><h1>TremorGuard 配网</h1><p>设备短码：__SHORTCODE__ · 热点 IP：192.168.4.1</p></div>

<form class=card id=frm autocomplete=off onsubmit="return submitForm(event)">
  <label for=ssid>WiFi 名称 (SSID) <span style="color:#ef4444">*</span></label>
  <div class=row>
    <select id=ssid class=select required>
      <option value="">-- 点击「扫描」选择网络 --</option>
    </select>
    <button type=button class="btn ghost" style="width:auto;margin:0;padding:0 14px" id=scanBtn onclick="scanWifi()">扫描</button>
  </div>
  <input id=ssidFree class=input style="margin-top:8px" placeholder="未列出？手动输入 SSID…" oninput="document.getElementById('ssid').value=this.value">

  <label for=pass>WiFi 密码</label>
  <input id=pass class=input type=password placeholder="开放网络请留空" maxlength=63>

  <label for=srv>服务器地址 <span style="color:#ef4444">*</span></label>
  <input id=srv class=input placeholder="如 http://192.168.1.100:8080" value="__DEFSRV__">

  <div class=err id=err></div>
  <button type=submit class=btn id=submitBtn>开始连接</button>
</form>

<div class=card>
  <div class=status id=st><span class=tag>就绪</span>等待输入…</div>
  <div class=bar id=bar><i></i></div>
</div>

<div class=tip>
  · 若无浏览器自动弹出，请手动访问 <span class=kbd>http://192.168.4.1</span><br>
  · 密码错误或连接失败，会保留原有网络凭证并返回此页<br>
  · 连接成功后会自动关闭热点，设备接入指定 WiFi
</div>
</div>

<script>
const st=document.getElementById('st'),bar=document.getElementById('bar'),
  err=document.getElementById('err'),btn=document.getElementById('submitBtn');
function setStatus(html,loading){
  st.innerHTML=html; bar.style.display=loading?'block':'none';
}
function showErr(msg){
  if(!msg){err.style.display='none';err.textContent='';return;}
  err.style.display='block';err.textContent=msg;
}
async function scanWifi(){
  const sb=document.getElementById('scanBtn'), sel=document.getElementById('ssid');
  sb.disabled=true; sb.textContent='扫描中…';
  setStatus('<span class=tag>扫描</span>正在扫描附近 WiFi…',true);
  try{
    const r=await fetch('/scan',{cache:'no-store'});
    const j=await r.json();
    sel.innerHTML='<option value="">-- 选择网络 --</option>';
    if(j.length===0){
      sel.innerHTML+='<option value="">(未扫描到，请手动输入)</option>';
    }else{
      j.sort((a,b)=>b.rssi-a.rssi).forEach(n=>{
        const o=document.createElement('option');
        o.value=n.ssid;
        const lock=n.open?'🔓':'🔒';
        const bars=n.rssi>-50?'●●●●':n.rssi>-65?'●●●○':n.rssi>-75?'●●○○':'●○○○';
        o.textContent=lock+' '+bars+' '+n.ssid+' ('+n.rssi+' dBm, '+n.enc+')';
        sel.appendChild(o);
      });
    }
    setStatus('<span class=tag>完成</span>扫描到 '+(j?.length||0)+' 个网络，请选择 SSID。',false);
  }catch(e){
    setStatus('<span class=tag style="background:#fef2f2;color:#b91c1c">错误</span>扫描失败：'+e.message,false);
  }finally{
    sb.disabled=false; sb.textContent='扫描';
  }
}
function validate(f){
  if(!f.ssid||f.ssid.length<1||f.ssid.length>32)return 'SSID 长度必须为 1~32 字符';
  if(f.password.length>0 && f.password.length<8)return '加密网络密码至少 8 位（开放网络留空即可）';
  if(f.password.length>63)return 'WiFi 密码过长（最多 63 字符）';
  if(!/^https?:\/\/[A-Za-z0-9\-\.:\/]+$/.test(f.server))return '服务器地址格式错误，需以 http:// 或 https:// 开头，如 http://192.168.1.100:8080';
  return '';
}
async function submitForm(e){
  e.preventDefault();
  const f={
    ssid:document.getElementById('ssid').value||document.getElementById('ssidFree').value,
    password:document.getElementById('pass').value,
    server:document.getElementById('srv').value
  };
  showErr(validate(f));
  if(err.style.display==='block')return;
  btn.disabled=true;
  const body='ssid='+encodeURIComponent(f.ssid)
    +'&password='+encodeURIComponent(f.password)
    +'&server='+encodeURIComponent(f.server);
  try{
    const r=await fetch('/save',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    const html=await r.text();
    // /save 返回连接中页面，其中包含轮询逻辑；直接替换整页可获得 meta refresh 兜底
    document.open(); document.write(html); document.close();
  }catch(e){
    showErr('请求失败：'+e.message);
    btn.disabled=false;
  }
}
</script></body></html>
)rawliteral";

// 提交后「连接中」页面：meta refresh 兜底 + 每 1s 轮询 /status
static const char CONNECTING_HTML[] PROGMEM = R"rawliteral(
<!doctype html><html lang=zh-CN><head><meta charset=utf-8><meta http-equiv=refresh content="3;url=/">
<meta name=viewport content="width=device-width,initial-scale=1">
<title>正在连接… TremorGuard</title>
<style>
body{margin:0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",Arial;background:#f5f7fa;color:#1f2937}
.wrap{max-width:480px;margin:40px auto;padding:20px}
.card{background:#fff;border-radius:14px;padding:24px;margin-top:16px;box-shadow:0 2px 10px rgba(16,24,40,.06);text-align:center}
.spin{width:42px;height:42px;border:4px solid #e5e7eb;border-top-color:#6366f1;border-radius:50%;animation:spin 0.8s linear infinite;margin:10px auto}
@keyframes spin{to{transform:rotate(360deg)}}
.tag{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;background:#eef2ff;color:#4338ca;margin-right:6px}
.bar{height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:16px}
.bar>i{display:block;height:100%;width:40%;background:linear-gradient(90deg,#6366f1,#a855f7);animation:bar 1.2s linear infinite}
@keyframes bar{0%{width:0}50%{width:65%}100%{width:100%}}
.ok{margin-top:14px;padding:12px;border-radius:10px;background:#ecfdf5;color:#065f46;font-size:14px;text-align:left;display:none}
.bad{margin-top:14px;padding:12px;border-radius:10px;background:#fef2f2;color:#b91c1c;font-size:14px;text-align:left;display:none}
.btn{display:inline-block;margin-top:14px;padding:11px 20px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:600;display:none}
.btn.ghost{background:#f3f4f6;color:#374151;box-shadow:none;border:1px solid #e5e7eb;margin-right:8px}
p{color:#4b5563;font-size:14px;line-height:1.6}
</style></head><body><div class=wrap>
  <div class=card>
    <div class=spin></div>
    <h3 style="margin:8px 0 4px">正在尝试连接 <span style="color:#6366f1" id=ssidTxt>__SSID__</span>…</h3>
    <p><span class=tag id=tagTxt>连接中</span><span id=subTxt>请稍候，设备正在验证 WiFi 凭证</span></p>
    <div class=bar><i></i></div>
    <div class=ok id=ok></div>
    <div class=bad id=bad></div>
    <a class="btn ghost" id=backBtn href="/">返回修改</a>
    <a class=btn id=goBtn target=_top>WiFi 管理页面</a>
  </div>
</div>
<script>
async function tick(){
  try{
    const r=await fetch('/status',{cache:'no-store'});
    const j=await r.json();
    document.getElementById('subTxt').textContent = '已用时 '+(j.elapsedSec||0)+'s，尝试次数 '+(j.attempts||0)
      +'，状态码 '+(j.statusCode??'-');
    if(j.phase==='success'){
      document.querySelector('.spin').style.display='none';
      document.getElementById('tagTxt').textContent='成功';
      document.getElementById('tagTxt').style.background='#ecfdf5';
      document.getElementById('tagTxt').style.color='#065f46';
      document.getElementById('ok').style.display='block';
      document.getElementById('ok').innerHTML='✅ '+ (j.msg||'连接成功')+'<br>设备 IP：<b>'+j.ip+'</b><br>热点即将关闭，本设备请重新连接您的 WiFi。';
      document.getElementById('goBtn').href='http://'+j.ip;
      document.getElementById('goBtn').style.display='inline-block';
      return true;
    }
    if(j.phase==='failed'){
      document.querySelector('.spin').style.display='none';
      document.getElementById('tagTxt').textContent='失败';
      document.getElementById('tagTxt').style.background='#fef2f2';
      document.getElementById('tagTxt').style.color='#b91c1c';
      document.getElementById('bad').style.display='block';
      const reasons = {
        WRONG_PASSWORD:'❌ WiFi 密码错误，请重新输入',
        SSID_NOT_FOUND:'❌ 未找到该 SSID，请检查网络是否可用',
        TIMEOUT:'⏱️ 连接超时（15 秒无响应），请靠近路由器或换一个网络尝试',
        OTHER:'❌ 连接失败：'+(j.msg||'未知错误')
      };
      document.getElementById('bad').innerHTML = reasons[j.reason||'OTHER']||reasons.OTHER;
      document.getElementById('backBtn').style.display='inline-block';
      return true;
    }
  }catch(e){}
  return false;
}
let n=0;
const timer=setInterval(async()=>{
  n++;
  const stop=await tick();
  if(stop||n>60){clearInterval(timer);}
},1000);
tick();
</script></body></html>
)rawliteral";

/* ============================================================
 * NetManager
 * ============================================================ */

NetManager::NetManager()
    : _state(NET_CHECK)
    , _staStartMs(0), _staLastPrintMs(0), _staAttempts(0)
    , _apIP(AP_IP_0,AP_IP_1,AP_IP_2,AP_IP_3)
    , _apSubnet(255,255,255,0)
    , _pWebServer(nullptr)
    , _tempPhase(TEMP_IDLE), _tempStartMs(0), _tempFinishAt(0), _tempRetryAt(0), _tempAttempts(0)
    , _tempLastStatus(0)
{
    _saved.provisioned = 0;
    _pending.provisioned = 0;
}

/* ---------- NVS ---------- */
void NetManager::_loadNVS() {
    Preferences prefs;
    if (!prefs.begin(NET_NVS_NAMESPACE, true /*readonly*/)) {
        Serial.println(F("[NET] NVS: 未找到命名空间 " NET_NVS_NAMESPACE "，视为未配网。"));
        _saved.provisioned = 0;
        return;
    }
    _saved.ssid        = prefs.getString("ssid", "");
    _saved.password    = prefs.getString("password", "");
    _saved.serverUrl   = prefs.getString("server_url", "");
    _saved.provisioned = prefs.getUChar("provisioned", 0);
    prefs.end();

    if (_saved.provisioned == 1 && _saved.ssid.length() > 0) {
        Serial.print(F("[NET] NVS 已恢复: ssid="));
        Serial.print(_saved.ssid);
        Serial.print(F("  server="));
        Serial.println(_saved.serverUrl);
    } else {
        Serial.println(F("[NET] NVS 无有效配置（未配网）。"));
    }
}

bool NetManager::_saveToNVS(const NetConfig &c) {
    Preferences prefs;
    if (!prefs.begin(NET_NVS_NAMESPACE, false /*readwrite*/)) {
        Serial.println(F("[NET] NVS: 打开失败，无法写入。"));
        return false;
    }
    // 原子语义：先写字段，最后写 provisioned=1；若中间断电 provisioned!=1，下次视为未配网
    bool ok = true;
    ok &= prefs.putString("ssid",        c.ssid)      > 0;
    ok &= prefs.putString("password",    c.password)  >=0;  // 空字符串 = 0 字节写入，也 ok
    ok &= prefs.putString("server_url",  c.serverUrl) > 0;
    ok &= prefs.putUChar ("provisioned", 1)           > 0;
    prefs.end();
    if (ok) {
        Serial.println(F("[NET] NVS: 配置写入成功（原子）。"));
        _saved = c; _saved.provisioned = 1;
    } else {
        Serial.println(F("[NET] NVS: 部分字段写入失败，下次启动将重新配网。"));
    }
    return ok;
}

/* ---------- 配置格式校验（前端 + 后端双保险）---------- */
bool NetManager::_validateConfigFormat(const NetConfig &c, String &errMsg) const {
    if (c.ssid.length() < 1 || c.ssid.length() > 32) { errMsg = F("SSID 长度必须 1~32 字符"); return false; }
    if (c.password.length() > 0 && c.password.length() < 8) { errMsg = F("加密网络密码至少 8 位（开放网络请留空）"); return false; }
    if (c.password.length() > 63) { errMsg = F("WiFi 密码最多 63 字符"); return false; }
    if (c.serverUrl.length() < 8) { errMsg = F("服务器地址不能为空"); return false; }
    // 正则手工实现：^https?://[A-Za-z0-9\-\.:/]+$
    if (!c.serverUrl.startsWith("http://") && !c.serverUrl.startsWith("https://")) {
        errMsg = F("服务器地址需以 http:// 或 https:// 开头"); return false;
    }
    const char *p = c.serverUrl.c_str() + (c.serverUrl.startsWith("https://") ? 8 : 7);
    while (*p) {
        char ch = *p++;
        bool ok = isalnum((uint8_t)ch) || ch=='-' || ch=='.' || ch==':' || ch=='/';
        if (!ok) { errMsg = F("服务器地址包含非法字符"); return false; }
    }
    return true;
}

/* ---------- 通用 STA 连接发起（无 delay，仅触发）---------- */
void NetManager::_tryStaConnect(const char *ssid, const char *password) {
    WiFi.disconnect(true);
    delay(50);   // 必要短暂清理，50ms 不影响 100Hz 采样
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, (*password) ? password : NULL);
}

/* ---------- begin & 主循环分派 ---------- */

void NetManager::begin() {
    // 1. 生成设备短码（MAC 后 3 字节 → 6 Hex）
    WiFi.mode(WIFI_MODE_NULL);  // 先读 MAC，不启动射频
    String mac = WiFi.macAddress();
    // mac 形如 "XX:XX:XX:YY:YY:YY"，取 YYYYYY
    if (mac.length() >= 17) {
        _devShort = mac.substring(9,11) + mac.substring(12,14) + mac.substring(15,17);
    } else {
        _devShort = F("A1B2C3");  // 兜底
    }
    _devShort.toUpperCase();
    _apSSID = "TremorGuard-" + _devShort;

    Serial.print(F("[NET] 设备短码: "));
    Serial.print(_devShort);
    Serial.print(F("  SoftAP SSID: "));
    Serial.println(_apSSID);

    // 2. 读取已保存配置
    _loadNVS();

    // 3. 进入 NET_CHECK 分支（下一步由 loop 判定）
    _state = NET_CHECK;
    _staAttempts = 0;
}

void NetManager::loop(uint32_t nowMs) {
    switch (_state) {
        case NET_CHECK: _stepNetCheck(nowMs); break;
        case STA_CONN:  _stepStaConn(nowMs);  break;
        case STA_OK:    _stepStaOk(nowMs);    break;
        case SOFTAP:    _stepSoftAp(nowMs);   break;
    }
}

/* ---------- NET_CHECK：读取 NVS 后决定进入 STA_CONN 还是 SOFTAP ---------- */
void NetManager::_stepNetCheck(uint32_t now) {
    if (_saved.provisioned == 1 && _saved.ssid.length() > 0) {
        Serial.print(F("[NET] 启动恢复：尝试连接已保存 SSID="));
        Serial.println(_saved.ssid);
        _tryStaConnect(_saved.ssid.c_str(), _saved.password.c_str());
        _staStartMs   = now;
        _staLastPrintMs = now;
        _staAttempts  = 1;
        _state = STA_CONN;
    } else {
        Serial.println(F("[NET] 无已保存配置，直接进入 SoftAP 配网。"));
        _startSoftAP();
        _state = SOFTAP;
    }
}

/* ---------- STA_CONN：自动恢复阶段，非阻塞轮询 ---------- */
void NetManager::_stepStaConn(uint32_t now) {
    wl_status_t st = WiFi.status();

    // 每 100ms 打点一次进度
    if (now - _staLastPrintMs >= 100) {
        _staLastPrintMs = now;
        Serial.printf("[NET] STA 连接中… 尝试 %u/%u  状态=%d\n",
            (unsigned)_staAttempts, (unsigned)STA_MAX_ATTEMPTS, (int)st);
    }

    // 成功
    if (st == WL_CONNECTED) {
        Serial.print(F("[NET] STA 连接成功！IP="));
        Serial.println(WiFi.localIP());
        _state = STA_OK;
        return;
    }

    // 瞬时快速失败（无需等满超时）
    bool quickFail = (st == WL_NO_SSID_AVAIL) || (st == WL_CONNECT_FAILED);

    // 超时 or 快速失败 → 计一次失败
    uint32_t elapsed = now - _staStartMs;
    if (elapsed >= STA_CONNECT_TIMEOUT_MS || quickFail) {
        if (quickFail) {
            Serial.print(F("[NET] STA 快速失败："));
            if (st == WL_NO_SSID_AVAIL)   Serial.println(F("SSID 不存在(WL_NO_SSID_AVAIL)"));
            if (st == WL_CONNECT_FAILED)  Serial.println(F("认证失败/WiFi 密码错误(WL_CONNECT_FAILED)"));
        } else {
            Serial.println(F("[NET] STA 连接超时（15s），仍未连接。"));
        }
        if (_staAttempts < STA_MAX_ATTEMPTS) {
            _staAttempts++;
            Serial.printf("[NET] 第 %u 次重试…\n", (unsigned)_staAttempts);
            WiFi.disconnect(true);
            delay(200);
            WiFi.begin(_saved.ssid.c_str(), _saved.password[0] ? _saved.password.c_str() : NULL);
            _staStartMs = now;
            return;
        }
        // 达到最大尝试次数，进入 SoftAP 配网
        Serial.println(F("[NET] 所有自动恢复尝试失败，进入 SoftAP 配网模式。"));
        WiFi.disconnect(true);
        _startSoftAP();
        _state = SOFTAP;
    }
}

/* ---------- STA_OK：正常连接，监听断连 ---------- */
void NetManager::_stepStaOk(uint32_t now) {
    static uint32_t lastPrint = 0;
    static uint32_t failSince = 0;  // 非 CONNECTED 状态累积开始时间（0=正常）

    wl_status_t st = WiFi.status();
    if (st == WL_CONNECTED) {
        failSince = 0;  // 清除故障累积
        // 每 10s 打一次心跳（不影响采样）
        if (now - lastPrint >= 10000) {
            lastPrint = now;
            Serial.print(F("[NET] STA 心跳 IP=")); Serial.println(WiFi.localIP());
        }
        return;
    }

    // 非 CONNECTED → 先记一个 3s 防抖窗口（避免瞬时切换抖动）
    if (failSince == 0) {
        failSince = now;
        Serial.printf("[NET] STA 检测到异常状态 status=%d，启动 3s 防抖…\n", (int)st);
    }
    if (now - failSince < 3000) return;

    // 3s 仍未恢复 → 退回到 STA_CONN 走自动恢复（最多 3 次 15s 尝试，失败再进入 SoftAP）
    Serial.printf("[NET] STA 掉线 3s 仍未恢复(status=%d)，启动自动恢复流程…\n", (int)st);
    WiFi.disconnect(true);
    delay(100);
    WiFi.begin(_saved.ssid.c_str(), _saved.password[0] ? _saved.password.c_str() : NULL);
    _staStartMs   = now;
    _staLastPrintMs = now;
    _staAttempts  = 1;
    failSince = 0;
    _state = STA_CONN;
}

/* ---------- SOFTAP：Captive Portal + 临时 STA 验证 ---------- */
void NetManager::_startSoftAP() {
    Serial.println(F("[NET] === 进入 SoftAP 配网模式 ==="));
    WiFi.mode(WIFI_AP_STA);          // AP+STA 双模式：配网验证时不踢用户下线
    delay(20);
    if (!WiFi.softAPConfig(_apIP, _apIP, _apSubnet)) {
        Serial.println(F("[NET] ⚠️ softAPConfig 返回 false，仍尝试启动 AP…"));
    }
    // 开放热点（无密码）——用户需求未要求热点密码
    bool ok = WiFi.softAP(_apSSID.c_str(), NULL, 1, 0, 4);
    if (!ok) Serial.println(F("[NET] ⚠️ softAP 启动失败，请检查！"));

    Serial.print(F("[NET] SoftAP SSID: ")); Serial.println(_apSSID);
    Serial.print(F("[NET] SoftAP IP  : ")); Serial.println(WiFi.softAPIP());

    // DNSServer：把任何域名解析到 192.168.4.1（Captive Portal）
    _dnsServer.setTTL(300);
    if (!_dnsServer.start(53, "*", _apIP)) {
        Serial.println(F("[NET] ⚠️ DNSServer 启动失败（端口 53）。iOS/Android 可能不会自动弹窗，请手动访问 192.168.4.1。"));
    }

    // WebServer
    if (!_pWebServer) _pWebServer = new WebServer(80);
    _setupWebRoutes();
    _pWebServer->begin();
    Serial.println(F("[NET] WebServer + Captive Portal 已启动（监听 *:80）。"));

    _tempPhase = TEMP_IDLE;
}

void NetManager::_stopSoftAP() {
    Serial.println(F("[NET] 关闭 SoftAP & Captive Portal…"));
    if (_pWebServer) { _pWebServer->stop(); delete _pWebServer; _pWebServer = nullptr; }
    _dnsServer.stop();
    WiFi.softAPdisconnect(true);
    delay(30);
    WiFi.mode(WIFI_STA);
}

void NetManager::_setupWebRoutes() {
    if (!_pWebServer) return;
    using namespace std::placeholders;
    _pWebServer->on("/",     HTTP_GET,  std::bind(&NetManager::_hRoot,   this));
    _pWebServer->on("/scan", HTTP_GET,  std::bind(&NetManager::_hScan,   this));
    _pWebServer->on("/save", HTTP_POST, std::bind(&NetManager::_hSave,   this));
    _pWebServer->on("/status",HTTP_GET, std::bind(&NetManager::_hStatus, this));
    // Captive Portal 兜底：未知路径 302 到 /
    _pWebServer->onNotFound([this](){
        if (!_pWebServer) return;
        _pWebServer->sendHeader("Location", "/", true);
        _pWebServer->send(302, "text/plain", "");
    });
}

void NetManager::_handleCaptivePortalTick() {
    _dnsServer.processNextRequest();
    if (_pWebServer) _pWebServer->handleClient();
}

/* ---------- HTTP Handlers（短处理，无 delay 无长 while）---------- */

void NetManager::_hRoot() {
    if (!_pWebServer) return;
    String html = FPSTR(INDEX_HTML);
    html.replace("__SHORTCODE__", _devShort);
    html.replace("__DEFSRV__",    _saved.serverUrl.length()>0 ? _saved.serverUrl : "");
    _pWebServer->send(200, "text/html; charset=utf-8", html);
}

void NetManager::_hScan() {
    if (!_pWebServer) return;
    // 临时 STA 验证进行中，禁止扫描以免打断
    if (_tempPhase == TEMP_CONNECTING) {
        _pWebServer->send(409, "application/json", "{\"error\":\"正在连接中，请勿扫描\"}");
        return;
    }
    WiFi.scanDelete();
    int n = WiFi.scanNetworks(false /*async*/, false /*hidden*/);
    String json = "[";
    for (int i = 0; i < n; i++) {
        if (i) json += ",";
        json += "{";
        json += "\"ssid\":\"" + WiFi.SSID(i) + "\",";
        json += "\"rssi\":" + String(WiFi.RSSI(i)) + ",";
        json += "\"enc\":\""  + _encryptionStr(WiFi.encryptionType(i)) + "\",";
        json += "\"open\":"   + String(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "true" : "false");
        json += "}";
    }
    json += "]";
    WiFi.scanDelete();
    _pWebServer->send(200, "application/json; charset=utf-8", json);
}

void NetManager::_hSave() {
    if (!_pWebServer) return;
    // 读参数
    NetConfig c;
    c.ssid      = _pWebServer->arg("ssid");
    c.password  = _pWebServer->arg("password");
    c.serverUrl = _pWebServer->arg("server");
    c.provisioned = 0;
    // 后端格式再校验
    String errMsg;
    if (!_validateConfigFormat(c, errMsg)) {
        String html = FPSTR(INDEX_HTML);
        html.replace("__SHORTCODE__", _devShort);
        html.replace("__DEFSRV__",    c.serverUrl);
        // 错误提示：通过追加 <script> 写入 err div 文本 & 填回 SSID/服务器（密码不回填）
        String inject = "\n<script>";
        inject += "document.addEventListener('DOMContentLoaded',function(){";
        inject += "var e=document.getElementById('err');e.style.display='block';e.textContent="
                  "\"" + errMsg + "\";";
        inject += "var s=document.getElementById('ssidFree');s.value=\"" + c.ssid + "\";";
        inject += "document.getElementById('srv').value=\"" + c.serverUrl + "\";";
        inject += "});\n<\/script>\n</body>";
        html.replace("</body>", inject);
        _pWebServer->send(200, "text/html; charset=utf-8", html);
        return;
    }
    // 校验通过：启动临时 STA 验证（返回 CONNECTING 页，由 /status 轮询推进）
    _pending = c;
    _pending.provisioned = 0;
    WiFi.disconnect(true);
    delay(30);
    WiFi.mode(WIFI_AP_STA);   // 保持 AP！
    WiFi.begin(c.ssid.c_str(), c.password[0] ? c.password.c_str() : NULL);
    _tempPhase      = TEMP_CONNECTING;
    _tempStartMs    = millis();
    _tempFinishAt   = 0;
    _tempRetryAt    = 0;
    _tempAttempts   = 1;
    _tempLastStatus = (int)WiFi.status();
    _tempFailReason = "";

    String page = FPSTR(CONNECTING_HTML);
    page.replace("__SSID__", c.ssid);
    _pWebServer->send(200, "text/html; charset=utf-8", page);
}

void NetManager::_hStatus() {
    if (!_pWebServer) return;
    String s = "{";
    if (_tempPhase == TEMP_IDLE) {
        s += "\"phase\":\"idle\"";
    } else if (_tempPhase == TEMP_CONNECTING) {
        // 由 loop 主分支推进；这里只读取当前状态
        uint32_t elapsed = (millis() - _tempStartMs) / 1000UL;
        s += "\"phase\":\"connecting\",";
        s += "\"attempts\":" + String((unsigned)_tempAttempts) + ",";
        s += "\"elapsedSec\":" + String(elapsed) + ",";
        s += "\"statusCode\":" + String(_tempLastStatus);
    } else if (_tempPhase == TEMP_SUCCESS) {
        s += "\"phase\":\"success\",";
        s += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
        s += "\"msg\":\"连接成功，已写入 NVS。热点即将关闭…\"";
    } else { // TEMP_FAILED
        s += "\"phase\":\"failed\",";
        s += "\"reason\":\"" + _tempFailReason + "\",";
        s += "\"msg\":\"验证失败，原有网络凭证未修改\"";
    }
    s += "}";
    _pWebServer->send(200, "application/json; charset=utf-8", s);
}

/* ---------- SOFTAP 分支推进（含临时 STA 验证状态机）---------- */
void NetManager::_stepSoftAp(uint32_t now) {
    // ① DNS + HTTP 轻量轮询（<3ms 每次）
    _handleCaptivePortalTick();

    // ② 临时 STA 验证状态机（用户提交后走的路径）
    if (_tempPhase == TEMP_CONNECTING) {
        wl_status_t st = WiFi.status();
        _tempLastStatus = (int)st;

        if (st == WL_CONNECTED) {
            // 成功：先写 NVS（原子），再关 SoftAP，进 STA_OK
            Serial.print(F("[NET] 临时 STA 验证成功！IP=")); Serial.println(WiFi.localIP());
            _tempPhase = TEMP_SUCCESS; // 让 /status 立刻返回 success（响应一次前端）
            if (_saveToNVS(_pending)) {
                // 给 /status 有 1.5s 时间返回 success，然后关 SoftAP 切到 STA
                if (_tempFinishAt == 0) _tempFinishAt = now + 1500;
                if ((int32_t)(now - _tempFinishAt) >= 0) {
                    _tempFinishAt = 0;
                    _stopSoftAP();
                    _tempPhase = TEMP_IDLE;
                    _state = STA_OK;
                }
            } else {
                // NVS 写入失败（极少）→ 视为失败，不清 NVS
                _tempPhase      = TEMP_FAILED;
                _tempFailReason = F("OTHER");
                WiFi.disconnect();
                Serial.println(F("[NET] NVS 写入失败，放弃此次修改。"));
            }
            return;
        }

        // 快速失败
        String quickReason;
        if      (st == WL_NO_SSID_AVAIL)  quickReason = F("SSID_NOT_FOUND");
        else if (st == WL_CONNECT_FAILED) quickReason = F("WRONG_PASSWORD");
        if (quickReason.length() > 0 && _tempAttempts >= SOFTAP_MAX_ATTEMPTS) {
            Serial.print(F("[NET] 临时 STA 快速失败（")); Serial.print(quickReason); Serial.println(F("），达到最大尝试次数。"));
            _tempPhase = TEMP_FAILED;
            _tempFailReason = quickReason;
            WiFi.disconnect();
            return;
        }
        if (quickReason.length() > 0) {
            // 还有尝试次数，等 2s 重试（避免抖动；这段期间采样继续）
            if (_tempRetryAt == 0) _tempRetryAt = now + 2000;
            if ((int32_t)(now - _tempRetryAt) >= 0) {
                _tempRetryAt = 0;
                _tempAttempts++;
                WiFi.disconnect(true);
                delay(50);
                WiFi.mode(WIFI_AP_STA);
                WiFi.begin(_pending.ssid.c_str(), _pending.password[0] ? _pending.password.c_str() : NULL);
                _tempStartMs = now;
                Serial.printf("[NET] 临时 STA 第 %u 次重试(%s)…\n", (unsigned)_tempAttempts, quickReason.c_str());
            }
            return;
        }

        // 超时
        uint32_t elapsed = now - _tempStartMs;
        if (elapsed >= STA_CONNECT_TIMEOUT_MS) {
            if (_tempAttempts < SOFTAP_MAX_ATTEMPTS) {
                _tempAttempts++;
                Serial.printf("[NET] 临时 STA 超时，第 %u 次重试…\n", (unsigned)_tempAttempts);
                WiFi.disconnect(true);
                delay(50);
                WiFi.mode(WIFI_AP_STA);
                WiFi.begin(_pending.ssid.c_str(), _pending.password[0] ? _pending.password.c_str() : NULL);
                _tempStartMs = now;
                return;
            }
            Serial.println(F("[NET] 临时 STA 验证超时，达到最大尝试次数。"));
            _tempPhase = TEMP_FAILED;
            _tempFailReason = F("TIMEOUT");
            WiFi.disconnect();
        }
    }
}

/* ---------- 帮助：加密类型名称 ---------- */
String NetManager::_encryptionStr(wifi_auth_mode_t t) {
    switch (t) {
        case WIFI_AUTH_OPEN:            return "OPEN";
        case WIFI_AUTH_WEP:             return "WEP";
        case WIFI_AUTH_WPA_PSK:         return "WPA";
        case WIFI_AUTH_WPA2_PSK:        return "WPA2";
        case WIFI_AUTH_WPA_WPA2_PSK:    return "WPA+WPA2";
        case WIFI_AUTH_WPA2_ENTERPRISE: return "WPA2-EAP";
        case WIFI_AUTH_WPA3_PSK:        return "WPA3";
        case WIFI_AUTH_WPA2_WPA3_PSK:   return "WPA2+WPA3";
        case WIFI_AUTH_WAPI_PSK:        return "WAPI";
        default:                        return "UNKNOWN";
    }
}

/* ---------- 串口状态行（供主程序窗口报告调用）---------- */
void NetManager::printStatusLine(Print &out) const {
    out.print(F("[NET] "));
    switch (_state) {
        case NET_CHECK:
            out.print(F("NET_CHECK 读取配置中")); break;
        case STA_CONN:
            out.print(F("STA_CONN 尝试 "));
            out.print((unsigned)_staAttempts);
            out.print(F("/"));
            out.print((unsigned)STA_MAX_ATTEMPTS);
            break;
        case STA_OK:
            out.print(F("STA 已连接 IP="));
            out.print(WiFi.localIP());
            out.print(F("  SSID="));
            out.print(WiFi.SSID());
            break;
        case SOFTAP:
            out.print(F("SoftAP "));
            out.print(_apSSID);
            out.print(F("  IP="));
            out.print(WiFi.softAPIP());
            out.print(F("  STA="));
            if (_tempPhase == TEMP_CONNECTING) {
                out.print(F("验证中("));
                out.print(_pending.ssid);
                out.print(F(")"));
            } else if (_tempPhase == TEMP_SUCCESS) {
                out.print(F("成功→等待关闭"));
            } else if (_tempPhase == TEMP_FAILED) {
                out.print(F("失败("));
                out.print(_tempFailReason);
                out.print(F(")"));
            } else {
                out.print(F("待配网"));
            }
            break;
    }
    out.println();
}
