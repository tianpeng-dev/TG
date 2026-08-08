# 后端 Auth + 患者档案 + 设备绑定 API 实现计划

> 技术栈：FastAPI · SQLAlchemy 2 (async) · Alembic · PyJWT · bcrypt · pytest
> 范围：`/v1/auth`、`/v1/me`、患者档案（改造为鉴权+所有权）、设备绑定 API，含迁移、seed、完整测试

---

## 一、当前状态分析（基于 Phase 1 探索）

### 已有架构（`tremorguard-backend/`）
- **分层**：`api/v1 → services → repositories → models → schemas`，以 `patients` 模块为范本
- **Base**（`app/models/base.py`）：`Base` + `TimestampMixin`（`created_at`/`updated_at`，`DateTime(timezone=True)`，server_default=now）+ `SyncMixin`（`client_version: int` default 1，`synced: bool` default False）
- **Repository**（`app/repositories/base.py`）：PEP 695 泛型 `BaseRepository[ModelT: Base, IdT]`，提供 `find_by_id / find_all / save(flush+refresh, 不 commit) / delete / count`
- **Session 依赖**（`app/api/deps.py`）：`get_session` 是可被测试 override 的接缝；`SessionDep = Annotated[AsyncSession, Depends(get_session)]`
- **异常**（`app/core/exceptions.py`）：`NotFoundError`(404) / `ConflictError`(409) + 全局 handler，返回 `{code, message, details}` 形状
- **Config**（`app/core/config.py`）：`pydantic-settings` 单例 `settings`，从 `.env` 加载
- **Alembic**（`alembic/env.py`）：`settings.database_url` 注入；模型须 `import app.models.xxx # noqa: F401` 才会注册到 `Base.metadata`；迁移手写 `sa.Column`
- **测试**（`tests/conftest.py`）：SQLite 内存 `Base.metadata.create_all`；override `get_session`；`asyncio_mode=auto`；`httpx.AsyncClient` + `ASGITransport`
- **已有端点**：`GET /api/v1/health`、`POST /api/v1/patients`、`GET /api/v1/patients/{id}`（当前**无鉴权**）

### 前端契约约束（基于 Phase 1 探索）
- 前端**无**任何 auth/user/device/onboarding 契约 —— 后端可自由设计
- 须遵守的既有约定：`UserRole` 枚举值为 `PATIENT`/`DOCTOR`/`ADMIN`/`CAREGIVER`（大写）
- camelCase 字段：`*At` 时间戳、`clientVersion` 乐观锁、`deviceCode`/`deviceKey` 等
- `WristbandBinding` 前端域模型字段：`id, wristbandId, patientId, boundAt, unboundAt, status: 'active'|'unbound', unboundReason, clientVersion` —— 设备绑定表对齐此结构（用 `deviceId` 替代 `wristbandId`）
- 错误形状：`ApiError { code, message, details? }`

### 当前依赖缺口（`pyproject.toml`）
- 缺 `PyJWT`（JWT 签发/校验）
- 缺 `bcrypt`（密码与设备密钥哈希）
- 不需要 `python-multipart`（登录用 JSON body，非 OAuth2 form）；用 `HTTPBearer` 提取 Bearer token

---

## 二、设计决策与假设

> 用户跳过了澄清提问，以下采用推荐方案，执行者无需再做选择。

### D1. Onboarding 三状态（领域驱动，自动推导，不持久化）
状态由 `/me` 端点根据 DB 实时状态推导，避免脏状态：
- `PROFILE_PENDING` —— 用户已注册，未创建患者档案
- `DEVICE_PENDING` —— 已创建患者档案，未绑定活跃设备
- `COMPLETED` —— 已创建患者档案 + 存在 `status='active'` 的设备绑定

推导逻辑：`has_profile = patient_profile.user_id == current_user.id`；`has_device = exists(device_binding where patient_id == profile.id and status=='active')`。

### D2. 设备绑定模型（独立绑定表，对齐前端 WristbandBinding）
- `devices` 表：存设备凭证（`device_key_hash`，bcrypt）+ 元数据
- `device_bindings` 表：绑定生命周期（bound/unbound），对齐前端 `WristbandBinding`，支持审计
- 绑定流程：设备由 seed/admin 预置（device_code + device_key 明文给用户）→ 患者用 `device_code` + `device_key` 调 bind → 服务端 bcrypt 校验 → 创建 `active` 绑定
- 解绑流程：设置 `unbound_at` + `status='unbound'` + `unbound_reason`，保留历史

### D3. 认证模型（JWT access + 可撤销 refresh）
- **Access token**：短有效期（默认 60 分钟），无状态 JWT，claims = `{ sub: user_id, role, type: "access", exp, iat }`
- **Refresh token**：长有效期（默认 30 天），存哈希到 `refresh_tokens` 表（用 `hashlib.sha256`，因 token 已是高熵随机串，无需 bcrypt 慢哈希），支持轮换与撤销
- **Logout**：撤销 refresh token（设 `revoked_at`）；access token 靠过期自然失效
- **Refresh**：校验 refresh token 未撤销未过期 → 撤销旧 token → 签发新 token 对（轮换，防重放）

### D4. 所有权模型
- `patient_profiles` 新增 `user_id` 列（FK → users.id，nullable 以兼容迁移，API 层强制必填）—— 1:1（一个患者用户一个档案）
- `device_bindings.patient_id` → `patient_profiles.id`
- 所有权校验：`get_current_patient` 依赖加载当前用户的 patient profile；`GET /patients/{id}` 查询后校验 `patient.user_id == current_user.id`，否则 `ForbiddenError`(403)
- 本期范围：患者用户只能访问自己的档案与设备；医生/管理员跨用户访问为 v2 范围（不在本次实现）

### D5. 密码与设备密钥哈希
- 密码：`bcrypt.hashpw(pw.encode(), bcrypt.gensalt())` / `bcrypt.checkpw`
- 设备密钥：同 bcrypt（用户明确要求 "设备密钥只存哈希"）
- Refresh token：`hashlib.sha256(token.encode()).hexdigest()`（高熵 token 无需慢哈希）

### D6. 现有 patients 端点改造
- `POST /api/v1/patients` 与 `GET /api/v1/patients/{id}` 从**公开**改为**需鉴权**（`Depends(get_current_patient)`）
- 现有 `test_patients.py` 须更新为先注册+登录拿 token 再请求
- `PatientProfile` 模型加 `user_id` 列；`PatientService.create_patient` 自动绑定当前用户

---

## 三、实现步骤（按依赖顺序）

### 步骤 1：依赖与配置

**`pyproject.toml`** — `[project.dependencies]` 增加：
```toml
"PyJWT>=2.8.0",
"bcrypt>=4.1.0",
```
然后执行 `pip install -e ".[dev]"` 安装。

**`app/core/config.py`** — `Settings` 增加字段：
```python
# JWT
jwt_secret_key: str = "change-me-in-production"
jwt_algorithm: str = "HS256"
access_token_expire_minutes: int = 60
refresh_token_expire_days: int = 30
```

**`.env.example`** — 追加：
```env
# JWT
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30
```

---

### 步骤 2：安全核心 `app/core/security.py`（新建）

```python
import bcrypt
import hashlib
import jwt
from datetime import datetime, timedelta, timezone

from app.core.config import settings

# ---- 密码（bcrypt）----
def hash_password(password: str) -> str: ...       # bcrypt.hashpw + gensalt, return str
def verify_password(password: str, hashed: str) -> bool: ...  # bcrypt.checkpw

# ---- 设备密钥（bcrypt，同密码）----
def hash_device_key(key: str) -> str: ...          # 复用 hash_password
def verify_device_key(key: str, hashed: str) -> bool: ...     # 复用 verify_password

# ---- Refresh token（sha256，高熵无需慢哈希）----
def hash_token(token: str) -> str: ...             # hashlib.sha256(...).hexdigest()

# ---- JWT ----
def create_access_token(user_id: str, role: str, expires_delta: timedelta | None = None) -> str: ...
    # payload: {sub, role, type:"access", iat, exp}
    # exp = now + expires_delta or settings.access_token_expire_minutes

def create_refresh_token(user_id: str, expires_delta: timedelta | None = None) -> tuple[str, str]:
    # 返回 (token, jti)；jti 用于 DB 记录关联
    # type:"refresh"

def decode_token(token: str) -> dict: ...
    # jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    # 抛 UnauthorizedError（自定义）而非 jwt.PyJWTError
```

**测试可注入性**：`create_access_token` / `create_refresh_token` 接受 `expires_delta` 参数，测试传 `timedelta(seconds=-1)` 即可生成已过期 token。

---

### 步骤 3：异常扩展 `app/core/exceptions.py`（编辑）

新增三个异常类 + handler，复用 `{code, message, details}` 形状：

```python
class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized"):
        self.message = message
# handler → 401 {code: "UNAUTHORIZED", message}

class ForbiddenError(Exception):
    def __init__(self, message: str = "Forbidden"):
        self.message = message
# handler → 403 {code: "FORBIDDEN", message}

class BadRequestError(Exception):
    def __init__(self, message: str):
        self.message = message
# handler → 400 {code: "BAD_REQUEST", message}
```

**`app/main.py`**（编辑）—— 注册新 handler：
```python
app.add_exception_handler(UnauthorizedError, unauthorized_handler)
app.add_exception_handler(ForbiddenError, forbidden_handler)
app.add_exception_handler(BadRequestError, bad_request_handler)
```

---

### 步骤 4：模型层

**`app/models/user.py`**（新建）：
```python
class User(Base, TimestampMixin):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # PATIENT/DOCTOR/ADMIN/CAREGIVER
```

**`app/models/refresh_token.py`**（新建）：
```python
class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False)  # FK users.id
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

**`app/models/device.py`**（新建）：
```python
class Device(Base, TimestampMixin):
    __tablename__ = "devices"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    device_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    device_key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hardware_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

class DeviceBinding(Base, TimestampMixin, SyncMixin):
    __tablename__ = "device_bindings"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(36), nullable=False)  # FK devices.id
    patient_id: Mapped[str] = mapped_column(String(36), nullable=False)  # FK patient_profiles.id
    bound_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="active")  # active/unbound
    unbound_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
```

**`app/models/patient.py`**（编辑）—— 增加 `user_id` 列：
```python
user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)  # FK users.id, 1:1
```

**`alembic/env.py`**（编辑）—— 注册新模型：
```python
import app.models.user  # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.device  # noqa: F401
```

**`tests/conftest.py`**（编辑）—— 确保新模型在测试 DB 中建表：在 import 区追加（或确保通过 router 链传递导入）：
```python
import app.models.user  # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.device  # noqa: F401
```

---

### 步骤 5：Alembic 迁移 `alembic/versions/0002_auth_devices.py`（新建）

`down_revision = "0001"`，手写 `sa.Column`（含 mixin 列）：

```python
revision: str = "0002"
down_revision: str = "0001"

def upgrade() -> None:
    # 1. users
    op.create_table("users", ...id, email(unique), password_hash, role, created_at, updated_at)
    # 2. refresh_tokens
    op.create_table("refresh_tokens", ...id, user_id, token_hash, expires_at, revoked_at, created_at, updated_at)
    # 3. devices
    op.create_table("devices", ...id, device_code(unique), device_key_hash, name, firmware_version, hardware_version, created_at, updated_at)
    # 4. device_bindings
    op.create_table("device_bindings", ...id, device_id, patient_id, bound_at, unbound_at, status, unbound_reason, created_at, updated_at, client_version, synced)
    # 5. patient_profiles 加 user_id 列
    op.add_column("patient_profiles", sa.Column("user_id", sa.String(36), nullable=True))

def downgrade() -> None:
    op.drop_column("patient_profiles", "user_id")
    op.drop_table("device_bindings")
    op.drop_table("devices")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
```

---

### 步骤 6：Seed 脚本 `scripts/seed.py`（新建）

用 async engine + session 直接写入（不通过 Alembic data migration，便于 `python scripts/seed.py` 运行）：

1. 创建患者用户：`email=patient@tremorguard.local`，`password=Password123!`（bcrypt 哈希），`role=PATIENT`
2. 为该用户创建 patient_profile（name=张三, gender=male, birthDate=1955-03-15），设 `user_id`
3. 预置设备：`device_code=TG-WB-001`，`device_key=dev-secret-001`（bcrypt 哈希存 `device_key_hash`），name= TremorGuard 腕带

输出明文凭证供测试使用。脚本幂等（按 email / device_code 查重，已存在则跳过）。

---

### 步骤 7：Schema 层

**`app/schemas/user.py`**（新建）：
```python
class UserSchema(BaseModel):          # 读，from_attributes=True
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
    id: str
    email: str
    role: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

class TokenPairSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    token_type: str = Field(alias="tokenType", default="bearer")
    expires_in: int = Field(alias="expiresIn")  # access token 秒数

class OnboardingStatusSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    status: str  # PROFILE_PENDING / DEVICE_PENDING / COMPLETED
    has_profile: bool = Field(alias="hasProfile")
    has_device: bool = Field(alias="hasDevice")
```

**`app/schemas/auth.py`**（新建）：
```python
class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(default="PATIENT")  # 默认患者

class RegisterResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user: UserSchema
    tokens: TokenPairSchema

class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user: UserSchema
    tokens: TokenPairSchema

class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    refresh_token: str = Field(alias="refreshToken")

class RefreshResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    tokens: TokenPairSchema

class LogoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    refresh_token: str = Field(alias="refreshToken")
```

> `EmailStr` 需 `email-validator` 依赖。**决策**：不引入 `email-validator`，改用 `str` + 服务层正则校验，避免额外依赖。故 `email: str`，`AuthService` 内用简单正则校验格式。

**`app/schemas/device.py`**（新建）：
```python
class DeviceSchema(BaseModel):        # 读，from_attributes=True
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
    id: str
    device_code: str = Field(alias="deviceCode")
    name: str | None = None
    firmware_version: str | None = Field(alias="firmwareVersion")
    hardware_version: str | None = Field(alias="hardwareVersion")
    created_at: datetime = Field(alias="createdAt")

class DeviceBindingSchema(BaseModel):  # 读，对齐前端 WristbandBinding
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)
    id: str
    device_id: str = Field(alias="deviceId")
    patient_id: str = Field(alias="patientId")
    bound_at: datetime = Field(alias="boundAt")
    unbound_at: datetime | None = Field(alias="unboundAt")
    status: str  # active / unbound
    unbound_reason: str | None = Field(alias="unboundReason")
    client_version: int = Field(alias="clientVersion")

class BindDeviceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    device_code: str = Field(alias="deviceCode")
    device_key: str = Field(alias="deviceKey")

class BindDeviceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    binding: DeviceBindingSchema
    device: DeviceSchema

class UnbindDeviceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    reason: str | None = None  # device_lost/device_replaced/patient_withdrawal/other

class DeviceListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    items: list[DeviceBindingSchema]
    total: int
```

**`app/schemas/patient.py`**（编辑）—— `CreatePatientRequest` 无需 `user_id`（从当前用户注入）；`PatientProfileSchema` 可选暴露 `user_id`（本期不暴露，保持兼容）。

**`app/schemas/me.py`**（新建）：
```python
class MeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user: UserSchema
    onboarding: OnboardingStatusSchema
    patient: PatientProfileSchema | None = None  # 存在则返回
```

---

### 步骤 8：Repository 层

**`app/repositories/user.py`**（新建）：
```python
class UserRepository(BaseRepository[User, str]):
    def __init__(self, session): super().__init__(session, User)
    async def find_by_email(self, email: str) -> User | None:
        # select(User).where(User.email == email)
```

**`app/repositories/refresh_token.py`**（新建）：
```python
class RefreshTokenRepository(BaseRepository[RefreshToken, str]):
    def __init__(self, session): super().__init__(session, RefreshToken)
    async def find_by_hash(self, token_hash: str) -> RefreshToken | None: ...
```

**`app/repositories/device.py`**（新建）：
```python
class DeviceRepository(BaseRepository[Device, str]):
    def __init__(self, session): super().__init__(session, Device)
    async def find_by_device_code(self, code: str) -> Device | None: ...

class DeviceBindingRepository(BaseRepository[DeviceBinding, str]):
    def __init__(self, session): super().__init__(session, DeviceBinding)
    async def find_active_by_patient(self, patient_id: str) -> list[DeviceBinding]: ...
    async def find_active_by_device(self, device_id: str) -> DeviceBinding | None: ...
```

**`app/repositories/patient.py`**（编辑）—— 增加方法：
```python
async def find_by_user_id(self, user_id: str) -> PatientProfile | None:
    # select(PatientProfile).where(PatientProfile.user_id == user_id)
```

---

### 步骤 9：Service 层

**`app/services/auth.py`**（新建）—— `AuthService`：
- `register(req: RegisterRequest) -> RegisterResponse`
  - 校验 email 格式（正则）；查重 → 已存在则 `ConflictError("Email already registered")`
  - `hash_password` → 创建 User（id=uuid4）→ 创建 RefreshToken 记录 → 签发 access+refresh
  - 若 role=PATIENT，不自动建 profile（onboarding 从 PROFILE_PENDING 开始）
  - commit
- `login(req: LoginRequest) -> LoginResponse`
  - 查 email → 不存在或 `verify_password` 失败 → `UnauthorizedError("Invalid email or password")`
  - 创建 RefreshToken 记录 → 签发 token 对 → commit
- `refresh(req: RefreshRequest) -> RefreshResponse`
  - decode refresh token → 查 `token_hash` → 不存在/已撤销/已过期 → `UnauthorizedError`
  - 撤销旧 token（`revoked_at=now`）→ 签发新 token 对 + 新 RefreshToken 记录 → commit
- `logout(req: LogoutRequest) -> None`
  - decode → 查 hash → 撤销（`revoked_at=now`）→ commit；token 不存在也返回成功（幂等）

**`app/services/device.py`**（新建）—— `DeviceService`：
- `bind_device(patient_id: str, req: BindDeviceRequest) -> BindDeviceResponse`
  - 按 `device_code` 查 Device → 不存在 → `NotFoundError("Device", code)`
  - `verify_device_key(req.device_key, device.device_key_hash)` → 失败 → `UnauthorizedError("Invalid device key")`
  - 查该 device 是否已有 `active` binding → 已存在 → `ConflictError("Device already bound")`
  - 创建 DeviceBinding（id=uuid4, device_id, patient_id, bound_at=now, status='active'）→ commit
  - 返回 binding + device
- `unbind_device(patient_id: str, device_id: str, reason: str | None) -> DeviceBindingSchema`
  - 查 active binding where device_id + patient_id → 不存在 → `NotFoundError`
  - 校验 `binding.patient_id == patient_id`（所有权）→ 不匹配 → `ForbiddenError`
  - 设 `unbound_at=now`, `status='unbound'`, `unbound_reason=reason` → commit
- `list_bindings(patient_id: str) -> list[DeviceBindingSchema]`
  - 返回该 patient 的所有绑定（含历史 unbound）

**`app/services/patient.py`**（编辑）—— 改造：
- `create_patient(req, user_id: str) -> PatientProfileSchema`
  - 查该 user_id 是否已有 profile → 已存在 → `ConflictError("Patient profile already exists")`
  - 创建时设 `user_id=user_id`
- `get_patient(patient_id: str, current_user_id: str) -> PatientProfileSchema`
  - 查 profile → 不存在 → `NotFoundError`
  - 校验 `patient.user_id == current_user_id` → 不匹配 → `ForbiddenError("Not your patient profile")`

**`app/services/me.py`**（新建）—— `MeService`：
- `get_me(user: User) -> MeResponse`
  - 查 `patient_profile` by user_id → `has_profile`
  - 若有 profile，查 `device_binding` active by patient_id → `has_device`
  - 推导 onboarding status（D1 逻辑）
  - 组装 MeResponse（含 patient 或 None）

---

### 步骤 10：依赖层 `app/api/deps.py`（编辑）

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: SessionDep = None,  # 用 Annotated 组合
) -> User:
    # decode_token → 取 sub → session.get(User, sub)
    # 失败 → UnauthorizedError

# 用 Annotated 组合 SessionDep + token
CurrentUser = Annotated[User, Depends(get_current_user)]

async def get_current_patient(
    user: CurrentUser,
    session: SessionDep,
) -> PatientProfile:
    # repo.find_by_user_id(user.id) → 不存在 → BadRequestError("Complete your patient profile first")
CurrentPatient = Annotated[PatientProfile, Depends(get_current_patient)]
```

---

### 步骤 11：API 路由层

**`app/api/v1/auth.py`**（新建）—— `prefix="/auth", tags=["auth"]`：
```python
POST   /auth/register   → AuthService.register  (201)
POST   /auth/login      → AuthService.login     (200)
POST   /auth/refresh    → AuthService.refresh   (200)
POST   /auth/logout     → AuthService.logout    (200, {ok: true})
```

**`app/api/v1/me.py`**（新建）—— `prefix="/me", tags=["me"]`：
```python
GET    /me              → MeService.get_me      (200, MeResponse)
```

**`app/api/v1/patients.py`**（编辑）—— 改为鉴权：
```python
@router.post("", ...)
async def create_patient(request: CreatePatientRequest, user: CurrentUser, session: SessionDep):
    service = PatientService(session)
    patient = await service.create_patient(request, user.id)
    return CreatePatientResponse(patient=patient)

@router.get("/{patient_id}", ...)
async def get_patient(patient_id: str, user: CurrentUser, session: SessionDep):
    service = PatientService(session)
    patient = await service.get_patient(patient_id, user.id)
    return CreatePatientResponse(patient=patient)
```

**`app/api/v1/devices.py`**（新建）—— `prefix="/devices", tags=["devices"]`：
```python
POST   /devices/bind             → DeviceService.bind_device(current_patient, req)  (201)
POST   /devices/{device_id}/unbind → DeviceService.unbind_device(...)              (200)
GET    /devices                  → DeviceService.list_bindings(current_patient)    (200)
```

**`app/api/v1/router.py`**（编辑）：
```python
from app.api.v1 import auth, devices, health, me, patients
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(devices.router)
```

---

### 步骤 12：测试

**`tests/conftest.py`**（编辑）—— 增加鉴权辅助 fixture：
```python
@pytest.fixture
async def auth_client(client):
    """注册+登录后返回带 Authorization header 的 client"""
    await client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "password": "Password123!", "role": "PATIENT"
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com", "password": "Password123!"
    })
    token = resp.json()["tokens"]["accessToken"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
```
并追加新模型 import（步骤 4 已述）。

**`tests/test_auth.py`**（新建）—— 覆盖：
- `test_register_success` — 201，返回 user + tokens，password_hash 不出现在响应
- `test_register_duplicate_email` — 409 `{code:"CONFLICT"}`
- `test_login_success` — 200，返回 tokens
- `test_login_wrong_password` — 401 `{code:"UNAUTHORIZED"}`
- `test_refresh_success` — 200，新 token 对，旧 refresh 失效（再 refresh → 401）
- `test_logout` — logout 后 refresh → 401
- `test_access_token_expired` — 用 `create_access_token(expires_delta=timedelta(seconds=-1))` 生成过期 token → 访问 `/me` → 401
- `test_invalid_token` — 篡改 token → 401

**`tests/test_me.py`**（新建）—— 覆盖 onboarding 三状态：
- `test_me_profile_pending` — 刚注册，无 profile → `status="PROFILE_PENDING"`, `hasProfile=false`
- `test_me_device_pending` — 创建 profile 后 → `status="DEVICE_PENDING"`, `hasProfile=true`, `hasDevice=false`
- `test_me_completed` — bind 设备后 → `status="COMPLETED"`, `hasDevice=true`

**`tests/test_devices.py`**（新建）—— 覆盖：
- `test_bind_device_success` — 201，binding.status='active'
- `test_bind_device_wrong_key` — 401
- `test_bind_device_already_bound` — 第二次 bind 同一 device → 409
- `test_unbind_device` — unbind 后 status='unbound'，可重新 bind 其他设备
- `test_list_devices` — 含 active + unbound 历史
- `test_cross_user_device_access` — 用户 A 绑定的设备，用户 B 尝试 unbind → 404 或 403
- `test_bind_nonexistent_device` — 404

**`tests/test_patients.py`**（编辑）—— 改造现有测试：
- 用 `auth_client` 替代 `client`（先登录）
- `test_create_patient` — 201，patient.user_id == 当前用户
- `test_get_patient` — 200
- `test_get_patient_not_found` — 404
- `test_get_patient_unauthorized` — 无 token → 401
- `test_cross_user_patient_access` — 用户 A 创建 profile，用户 B 访问 → 403 `{code:"FORBIDDEN"}`
- `test_duplicate_profile` — 同一用户创建两次 → 409

**`tests/test_health.py`** — 无需改动（health 保持公开）。

---

## 四、验证步骤

1. **依赖安装**：`pip install -e ".[dev]"` 成功，无 SOCKS 错误（必要时 `unset ALL_PROXY all_proxy`）
2. **Lint**：`.venv/bin/ruff check .` 全绿；`.venv/bin/ruff format --check .` 全绿
3. **迁移**：`DATABASE_URL="sqlite+aiosqlite:///./test.db" .venv/bin/alembic upgrade head` 成功，建出 5 张表 + patient_profiles 新增 user_id 列
4. **Seed**：`python scripts/seed.py` 成功，输出凭证
5. **测试**：`.venv/bin/pytest -v` 全绿，覆盖：
   - token 过期（`test_access_token_expired`）
   - 重复邮箱（`test_register_duplicate_email`）
   - 重复设备绑定（`test_bind_device_already_bound`）
   - 跨用户访问（`test_cross_user_patient_access` + `test_cross_user_device_access`）
6. **手动验证**：启动 uvicorn，在 Swagger UI (`/docs`) 走完 注册→登录→Authorize→/me→建档→/me→绑设备→/me 流程，确认 onboarding 三状态正确流转

---

## 五、文件清单

| 操作 | 文件 |
|------|------|
| 编辑 | `pyproject.toml`、`.env.example`、`app/core/config.py`、`app/core/exceptions.py`、`app/main.py`、`app/models/patient.py`、`app/repositories/patient.py`、`app/services/patient.py`、`app/schemas/patient.py`、`app/api/deps.py`、`app/api/v1/patients.py`、`app/api/v1/router.py`、`alembic/env.py`、`tests/conftest.py`、`tests/test_patients.py` |
| 新建 | `app/core/security.py`、`app/models/user.py`、`app/models/refresh_token.py`、`app/models/device.py`、`app/repositories/user.py`、`app/repositories/refresh_token.py`、`app/repositories/device.py`、`app/services/auth.py`、`app/services/device.py`、`app/services/me.py`、`app/schemas/user.py`、`app/schemas/auth.py`、`app/schemas/device.py`、`app/schemas/me.py`、`app/api/v1/auth.py`、`app/api/v1/me.py`、`app/api/v1/devices.py`、`alembic/versions/0002_auth_devices.py`、`scripts/seed.py`、`tests/test_auth.py`、`tests/test_me.py`、`tests/test_devices.py` |
