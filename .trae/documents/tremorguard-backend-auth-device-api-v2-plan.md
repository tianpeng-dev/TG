# TremorGuard Backend: Auth / Me / 患者档案 / 设备绑定 API 计划（v2 复核）

## 一、仓库研究结论

**整体状态：✅ 核心需求已全部实现并通过验证。**

### 1.1 验证结果汇总（2026-08-08）

| 维度 | 结果 | 细节 |
|---|---|---|
| `ruff check` | ✅ 通过 | 0 错误 |
| `pytest -v` | ✅ 通过 | **28/28 passed**（10.88s） |
| Alembic 迁移 | ✅ 通过 | 0001 → 0002，SQLite 验证无误 |
| Seed 脚本 | ✅ 通过 | 用户/档案/设备 3 类数据幂等插入 |
| 服务器启动 | ✅ 运行中 | `http://localhost:8000`，健康检查返回 `{"status":"ok"}` |
| Swagger UI | ✅ 可访问 | `http://localhost:8000/docs` |

### 1.2 需求覆盖度检查清单

| 用户需求 | 状态 | 代码位置 |
|---|---|---|
| **/v1/auth 注册** | ✅ | [auth.py:18-21](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/api/v1/auth.py#L18-L21) + [auth.py:45-69](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/auth.py#L45-L69) |
| **/v1/auth 登录** | ✅ | [auth.py:24-27](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/api/v1/auth.py#L24-L27) + [auth.py:71-82](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/auth.py#L71-L82) |
| **/v1/auth 刷新** | ✅ | [auth.py:30-33](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/api/v1/auth.py#L30-L33) + [auth.py:84-113](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/auth.py#L84-L113) |
| **/v1/auth 注销** | ✅ | [auth.py:36-40](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/api/v1/auth.py#L36-L40) + [auth.py:115-125](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/auth.py#L115-L125) |
| **/v1/me onboarding 三状态** | ✅ | [me.py:19-43](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/me.py#L19-L43) — PROFILE_PENDING / DEVICE_PENDING / COMPLETED |
| **密码只存哈希** | ✅ bcrypt | [security.py:20-30](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/core/security.py#L20-L30) |
| **设备密钥只存哈希** | ✅ bcrypt | [security.py:33-40](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/core/security.py#L33-L40) |
| **患者档案所有权校验** | ✅ | [patient.py:39-47](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/patient.py#L39-L47) — user_id 比对 + ForbiddenError |
| **设备绑定所有权校验** | ✅ | [device.py:54-69](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/app/services/device.py#L54-L69) — patient_id 比对 + ForbiddenError |
| **Alembic 迁移 0002** | ✅ | [0002_auth_devices.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/alembic/versions/0002_auth_devices.py) |
| **Seed 脚本** | ✅ | [seed.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/scripts/seed.py) |
| **测试覆盖 token 过期** | ✅ | `test_access_token_expired` in [test_auth.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/tests/test_auth.py) |
| **测试覆盖重复邮箱** | ✅ | `test_register_duplicate_email` in [test_auth.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/tests/test_auth.py) |
| **测试覆盖重复设备** | ✅ | `test_bind_device_already_bound` in [test_devices.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/tests/test_devices.py) |
| **测试覆盖跨用户访问（患者）** | ✅ | `test_cross_user_patient_access` in [test_patients.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/tests/test_patients.py) |
| **测试覆盖跨用户访问（设备）** | ✅ | `test_cross_user_device_access` in [test_devices.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/tests/test_devices.py) |

### 1.3 已修复的已知问题（2026-08-08 修复）

1. **B008 Depends 函数参数调用**（`deps.py`）→ 改用 `Annotated` alias
2. **E501 行过长**（`security.py` docstring）→ 缩短
3. **UP017 `timezone.utc` → `UTC` alias**（多处）→ ruff --fix 自动修复
4. **F841 未使用变量 `payload`**（`auth.py:logout`）→ 移除赋值
5. **F841 未使用变量 `tokens_a`**（`test_devices.py`）→ 移除赋值
6. **TypeError: naive vs aware datetime**（`auth.py:refresh`）→ SQLite 读回时手动补 `tzinfo=UTC`

---

## 二、模块与文件总览

### 2.1 分层架构

```
app/
├── api/
│   ├── deps.py                          # 依赖注入（get_current_user, get_current_patient, SessionDep）
│   └── v1/
│       ├── router.py                    # /api/v1 汇总路由
│       ├── auth.py                      # /auth/* 端点
│       ├── me.py                        # /me 端点
│       ├── patients.py                  # /patients/* 端点
│       ├── devices.py                   # /devices/* 端点
│       └── health.py                    # /health 端点
├── services/
│   ├── auth.py                          # AuthService（register/login/refresh/logout）
│   ├── me.py                            # MeService（onboarding 状态推导）
│   ├── patient.py                       # PatientService（create/get + 所有权）
│   └── device.py                        # DeviceService（bind/unbind/list + 所有权）
├── repositories/
│   ├── base.py                          # 通用 CRUD Repository
│   ├── user.py                          # find_by_email
│   ├── refresh_token.py                 # find_by_hash
│   ├── patient.py                       # find_by_user_id
│   └── device.py                        # find_by_device_code / find_active_by_device / find_active_by_patient / find_all_by_patient
├── models/
│   ├── base.py                          # Base + TimestampMixin
│   ├── user.py                          # users 表
│   ├── refresh_token.py                 # refresh_tokens 表
│   ├── patient.py                       # patient_profiles 表（+ user_id 外键）
│   └── device.py                        # devices + device_bindings 表
├── schemas/
│   ├── auth.py                          # Register/Login/Refresh/Logout 请求响应
│   ├── user.py                          # UserSchema / TokenPairSchema / OnboardingStatusSchema
│   ├── me.py                            # MeResponse
│   ├── patient.py                       # PatientProfileSchema / CreatePatientRequest / CreatePatientResponse
│   ├── device.py                        # DeviceSchema / DeviceBindingSchema / Bind/Unbind 请求响应
│   └── common.py                        # 通用响应
├── core/
│   ├── config.py                        # Settings（JWT / DB / CORS）
│   ├── database.py                      # async engine + session factory
│   ├── security.py                      # bcrypt 哈希 / JWT 签发校验 / sha256 token 哈希
│   └── exceptions.py                    # 401/403/404/409/400 错误 + FastAPI handler
└── main.py                              # FastAPI app + CORS + exception handlers + router

alembic/
└── versions/
    ├── 0001_initial.py                  # patient_profiles 表
    └── 0002_auth_devices.py             # users / refresh_tokens / devices / device_bindings 表

scripts/
└── seed.py                              # 幂等 seed（用户 + 档案 + 设备）

tests/
├── conftest.py                          # fixtures：client / auth_client / seed_device / _register_and_login / _create_profile
├── test_auth.py                         # 9 tests
├── test_me.py                           # 3 tests（onboarding 三状态）
├── test_patients.py                     # 7 tests
├── test_devices.py                      # 8 tests
└── test_health.py                       # 1 test
```

---

## 三、执行步骤（现状核对）

> 说明：所有 12 个步骤均已实现，以下为实现方式的复核说明。

### 步骤 1：依赖配置（pyproject.toml / .env.example）

- 已包含：`fastapi>=0.110.0`, `sqlalchemy[asyncio]>=2.0.29`, `alembic>=1.13.1`, `PyJWT>=2.8.0`, `bcrypt>=4.1.0`
- dev 依赖：`pytest`, `pytest-asyncio`, `httpx`, `aiosqlite`（SQLite 内存测试用）, `ruff`
- `.env.example` 已配置：DATABASE_URL（PostgreSQL 生产 / SQLite 测试切换）、JWT 三组参数、CORS

### 步骤 2：安全工具（core/security.py）

```
密码哈希：       bcrypt.hashpw(bytes, gensalt())          → hash_password() / verify_password()
设备密钥哈希：   bcrypt.hashpw(bytes, gensalt())          → hash_device_key() / verify_device_key()
refresh token：  hashlib.sha256(token).hexdigest()       → hash_token()（仅存哈希，可撤销）
JWT access：     PyJWT encode(type=access)                → create_access_token() / decode_token()
JWT refresh：    PyJWT encode(type=refresh, jti=UUID)     → create_refresh_token() 返回 (token, jti)
```

### 步骤 3：异常扩展（core/exceptions.py + main.py handlers）

5 种自定义异常均已注册 FastAPI handler：
| 异常 | HTTP 状态 | code 字段 |
|---|---|---|
| UnauthorizedError | 401 | UNAUTHORIZED |
| ForbiddenError | 403 | FORBIDDEN |
| NotFoundError | 404 | NOT_FOUND |
| ConflictError | 409 | CONFLICT |
| BadRequestError | 400 | BAD_REQUEST |

### 步骤 4：模型层（models/*.py）

- `users`：id (UUID), email (UNIQUE), password_hash, role, created_at/updated_at
- `refresh_tokens`：id (jti), user_id, token_hash (UNIQUE), expires_at, revoked_at
- `patient_profiles`：id, user_id (FK users), name, gender, birth_date, phone, emergency_contact(JSON), diagnosis(JSON), medication_plan(JSON), client_version
- `devices`：id, device_code (UNIQUE), device_key_hash, name, firmware_version, hardware_version
- `device_bindings`：id, device_id (FK), patient_id (FK patients), bound_at, unbound_at, status, unbound_reason, client_version

### 步骤 5：Alembic 迁移 0002

文件：[0002_auth_devices.py](file:///Users/peng/Documents/trae_projects/TremorGuard/tremorguard-backend/alembic/versions/0002_auth_devices.py)

建表顺序：users → refresh_tokens → devices → device_bindings（外键依赖保证正确）

**验证结果**：`alembic upgrade head`（SQLite）✅ 两张 upgrade 均成功。

### 步骤 6：Seed 脚本（scripts/seed.py）

按 email / device_code / user_id 查重，幂等执行：
- 用户：`patient@tremorguard.local` / `Password123!`
- 档案：姓名"张三"，默认 Hoehn-Yahr 1 期
- 设备：`TG-WB-001` / `dev-secret-001`（设备密钥 bcrypt 哈希存储）

**验证结果**：`python scripts/seed.py`（SQLite）✅ 三类数据均成功插入。

### 步骤 7：Schema 层（schemas/*.py）

均采用 `ConfigDict(populate_by_name=True)` + `alias="camelCase"`，与前端 contract 对齐：
- `PatientProfileSchema.birth_date` ↔ `birthDate`
- `DeviceBindingSchema.device_id` ↔ `deviceId`
- `RefreshRequest.refresh_token` ↔ `refreshToken`

### 步骤 8：Repository 层（repositories/*.py）

继承 `BaseRepository<T, ID>`，扩展领域特定查询：
| Repo | 扩展方法 |
|---|---|
| UserRepository | `find_by_email(email)` |
| RefreshTokenRepository | `find_by_hash(token_hash)` |
| PatientRepository | `find_by_user_id(user_id)` |
| DeviceRepository | `find_by_device_code(device_code)` |
| DeviceBindingRepository | `find_active_by_device(device_id)` / `find_active_by_patient(patient_id)` / `find_all_by_patient(patient_id)` |

### 步骤 9：Service 层（services/*.py）

核心业务逻辑均在此层，已验证：

**AuthService**：
- `register()`：邮箱格式校验 → 重复邮箱 ConflictError → bcrypt 哈希 → 签发 token 对
- `login()`：邮箱+密码 bcrypt 校验 → UnauthorizedError
- `refresh()`：JWT 校验 type=refresh → hash_token 查 DB → 过期校验（SQLite tzinfo 兼容补丁）→ 撤销旧 token（轮换）→ 签发新 pair
- `logout()`：幂等；hash_token 查 DB → 置 revoked_at

**MeService**：
- `get_me()`：查 profile → 查 active bindings → 推导 onboarding 状态：
  ```
  无 profile                     → PROFILE_PENDING
  有 profile 无 active binding    → DEVICE_PENDING
  有 profile 且有 active binding  → COMPLETED
  ```

**PatientService**：
- `create_patient()`：重复创建 ConflictError
- `get_patient()`：NotFound → `patient.user_id != current_user_id` → ForbiddenError（所有权核心）

**DeviceService**：
- `bind_device()`：设备不存在 NotFound → bcrypt 校验设备密钥 Unauthorized → 设备已绑定 Conflict → 创建绑定
- `unbind_device()`：查 active binding → `binding.patient_id != current_patient` → ForbiddenError（所有权核心）→ 置 unbound_at/status
- `list_bindings()`：仅查当前 patient 的绑定

### 步骤 10：依赖层（api/deps.py）

```
SessionDep          = Annotated[AsyncSession, Depends(get_session)]       # 解决 B008
CredentialsDep      = Annotated[HTTPAuthorizationCredentials, Depends(security)]  # 解决 B008
get_current_user()  → decode JWT → DB 查用户 → 验证 token type=access → User
CurrentUser         = Annotated[User, Depends(get_current_user)]
get_current_patient → 依赖 CurrentUser → 查 patient → 无档案抛 BadRequest
CurrentPatient      = Annotated[PatientProfile, Depends(get_current_patient)]
```

### 步骤 11：API 路由（api/v1/*.py）

| 方法 | 路径 | 依赖 | 用途 |
|---|---|---|---|
| POST | `/api/v1/auth/register` | SessionDep | 注册，返回 user+tokens（201） |
| POST | `/api/v1/auth/login` | SessionDep | 登录，返回 user+tokens |
| POST | `/api/v1/auth/refresh` | SessionDep | 刷新 token 对 |
| POST | `/api/v1/auth/logout` | SessionDep | 撤销 refresh token |
| GET | `/api/v1/me` | CurrentUser + SessionDep | 用户信息 + onboarding 状态 |
| POST | `/api/v1/patients` | CurrentUser + SessionDep | 创建患者档案（201） |
| GET | `/api/v1/patients/{id}` | CurrentUser + SessionDep | 获取档案（校验所有权 403） |
| POST | `/api/v1/devices/bind` | CurrentPatient + SessionDep | 绑定设备（201） |
| POST | `/api/v1/devices/{id}/unbind` | CurrentPatient + SessionDep | 解绑（校验所有权 403） |
| GET | `/api/v1/devices` | CurrentPatient + SessionDep | 我的绑定列表 |
| GET | `/api/v1/health` | - | 健康检查 |

### 步骤 12：测试套件（28 tests）

**test_auth.py（9 tests）**
| 测试 | 验证点 |
|---|---|
| test_register_success | 注册成功 201，返回 camelCase 字段 |
| test_register_duplicate_email | 重复邮箱 → 409 CONFLICT |
| test_login_success | 登录成功 |
| test_login_wrong_password | 错误密码 → 401 |
| test_refresh_success | 刷新成功，返回新 token 对 |
| test_logout | 注销后 refresh 失效 → 401 |
| test_access_token_expired | 过期 JWT → 401（伪造 exp） |
| test_invalid_token | 垃圾 token → 401 |
| test_missing_token | 无 Authorization → 401 |

**test_me.py（3 tests）**
| 测试 | 验证点 |
|---|---|
| test_me_profile_pending | 注册后 → onboarding.status=PROFILE_PENDING |
| test_me_device_pending | 创建档案后 → DEVICE_PENDING |
| test_me_completed | 绑定设备后 → COMPLETED |

**test_patients.py（7 tests）**
| 测试 | 验证点 |
|---|---|
| test_create_patient | 201 + clientVersion=1 |
| test_get_patient | 按 id 查询 |
| test_get_patient_not_found | 不存在 → 404 NOT_FOUND |
| test_get_patient_unauthorized | 无 token → 401 |
| test_create_patient_unauthorized | 无 token → 401 |
| test_cross_user_patient_access | 用户 B 访问用户 A 档案 → 403 FORBIDDEN |
| test_duplicate_profile | 同一用户两次创建 → 409 CONFLICT |

**test_devices.py（8 tests）**
| 测试 | 验证点 |
|---|---|
| test_bind_device_success | 绑定成功 201 |
| test_bind_device_wrong_key | 错误设备密钥 → 401 |
| test_bind_device_already_bound | 重复绑定 → 409 |
| test_unbind_device | 解绑成功 status=unbound |
| test_list_devices | 列表返回绑定 |
| test_cross_user_device_access | 用户 B 解绑用户 A 设备 → 403 FORBIDDEN |
| test_bind_nonexistent_device | 不存在设备 → 404 |
| test_devices_requires_profile | 无档案 bind → 400 BadRequest |

---

## 四、潜在依赖与注意事项

### 4.1 数据库切换（SQLite 测试 vs PostgreSQL 生产）

- **conftest.py** 通过 override 强制使用 `sqlite+aiosqlite:///:memory:`（测试隔离）
- **生产**：`.env` 设置 `DATABASE_URL=postgresql+asyncpg://...`
- **SQLite 兼容性补丁**：`AuthService.refresh()` 中 `record.expires_at` 读回后可能为 naive datetime，已通过 `replace(tzinfo=UTC)` 兼容
- ⚠️ PostgreSQL 不会有此问题；该补丁仅为 SQLite 测试保留

### 4.2 Refresh token 轮换（防重放）

每次 refresh 成功后，旧 token 被标记 `revoked_at`，签发新 token。
- 风险：并发两次 refresh 使用同一旧 token → 第二次视为 revoked（符合安全预期）
- 注销采用幂等策略：token 无效或已撤销不报错

### 4.3 JWT HMAC Key 长度警告

运行测试时 PyJWT 输出 `InsecureKeyLengthWarning`：当前默认 `JWT_SECRET_KEY=change-me-in-production`（23 字节），RFC 7518 推荐 ≥32 字节。
- `.env.example` 中仅为示例，**生产部署必须替换**为足够长的随机串

### 4.4 bcrypt 版本

当前 `bcrypt>=4.1.0`（Python 3.12 兼容），使用 `bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))`。

---

## 五、可选后续动作（非本期需求）

以下不包含在用户请求中，仅为后续阶段建议：

1. **Sync 端点**：`/api/v1/sync/push` + `/api/v1/sync/pull`（对齐前端 `DEFAULT_SYNC_ENDPOINTS`）
2. **患者档案 UPDATE**：当前仅有 POST + GET，后续可加 PUT（含 client_version 乐观锁）
3. **患者档案列表**：当前仅支持按 id 查自己的；管理员/医生场景可能需要列表
4. **Refresh token 批量吊销**：如"退出所有设备"功能
5. **CORS origin 动态配置**：当前为逗号分隔字符串列表
6. **速率限制**：登录/注册接口建议加 rate limit 防暴力破解
7. **邮箱唯一性约束**：DB 层通过 Alembic 迁移已建 UNIQUE 索引；同时 service 层提前查询

---

## 六、总结

本计划涉及的 **12 个实施步骤 + 迁移 + seed + 28 个接口测试全部完成并通过验证**。核心需求：
- ✅ /v1/auth 四端点（注册/登录/刷新/注销）
- ✅ /v1/me onboarding 三状态推导
- ✅ /v1/patients 创建/获取 + 用户所有权校验
- ✅ /v1/devices 绑定/解绑/列表 + 患者所有权校验
- ✅ 密码和设备密钥 bcrypt 哈希存储，refresh token SHA-256 哈希存储
- ✅ 重复邮箱/设备冲突、token 过期、跨用户越权访问均已覆盖测试

**执行建议**：计划内容已实现，无需额外修改。可直接使用 `http://localhost:8000/docs` 进行 Swagger 交互验证，或运行 `pytest` / `ruff check` 重新验证。
