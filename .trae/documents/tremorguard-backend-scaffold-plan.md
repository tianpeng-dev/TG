# TremorGuard 后端脚手架搭建计划

## Summary

为 TremorGuard（帕金森病震颤监测智能腕带，二类医疗器械）搭建可迁移、可测试的 Python 后端脚手架，技术栈为 **Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2 (async) + Alembic + Uvicorn + Ruff + pytest**。后端将作为前端 monorepo 已定义的 API 契约与同步协议的服务端实现基础。

本阶段产出**项目骨架 + 配置 + Alembic 初始迁移 + 健康检查端点 + 一个样例 CRUD（Patient）**，演示完整的分层架构模式（api → service → repository → model）。不实现全部业务端点，与前端 scaffold 计划风格保持一致。

---

## Current State Analysis

### 既有产物

- **前端 Monorepo**（`tremorguard-frontend/`）：已完成初始化验证
  - 工具链：pnpm 9.15 + Turborepo 2.x + TypeScript 5.4+ (Node ≥18.18)
  - 7 个共享包 + 3 个应用（patient-app RN / doctor-dashboard Web / admin-console Web）
- **前端已定义的契约**（后端必须满足）：
  - `packages/shared-types/src/api/contracts.ts` — REST API 请求/响应契约（Patient/Report/Device）
  - `packages/shared-types/src/api/sync.ts` — 同步协议契约（SyncDelta/SyncPush/SyncPull）
  - `packages/sync-engine/src/network-adapter.ts` — 端点路径：`/api/v1/sync/push`、`/api/v1/sync/pull`、`/api/v1/sync/status`
  - `packages/storage-core/src/schema/` — 8 张表的 SQLite schema 定义（表名 + 列结构）
  - `packages/shared-types/src/domain/` — 7 个领域模型（PatientProfile/ClinicReport/TremorLevel/MedicationEvent/ThresholdConfig/DeviceStatus/WristbandBinding）

### 关键约束（来自项目记忆）

- 医疗器械数据需支持审计；50Hz 高频震颤数据写入
- 离线优先架构：网络仅用于同步，后端是同步对端
- 乐观锁版本号 `clientVersion` 贯穿所有实体
- 前端 `storage-core` 定义了 `Repository<T, ID>` 接口（findById/findAll/save/saveBatch/delete/count），后端应镜像此模式
- 既有教训：TS monorepo 中 `import type` 不可用于 enum（后端无此问题，但记录约定）

### 后端当前位置

- **无任何后端代码**，无 `tremorguard-backend/` 目录
- 前端 scaffold 计划明确写道"假设后端 API 尚未确定，network-adapter 仅定义接口"

---

## Proposed Changes

### 一、目录结构

新建 `tremorguard-backend/`（与 `tremorguard-frontend/` 平级）：

```
tremorguard-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI 应用工厂 + lifespan
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                 # Pydantic Settings（环境变量驱动）
│   │   ├── database.py               # SQLAlchemy async engine + session factory
│   │   └── exceptions.py             # 自定义异常 + 全局异常处理器
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                   # DeclarativeBase + TimestampMixin + ClientVersionMixin
│   │   └── patient.py                # PatientProfile ORM（镜像前端 patient_profiles 表）
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py                 # ApiError, PaginatedResponse（对应 contracts.ts）
│   │   └── patient.py                # CreatePatientRequest/Response（对应 contracts.ts）
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py                   # BaseRepository（镜像 storage-core Repository 接口）
│   │   └── patient.py                # PatientRepository
│   ├── services/
│   │   ├── __init__.py
│   │   └── patient.py                # PatientService（业务逻辑层）
│   └── api/
│       ├── __init__.py
│       ├── deps.py                   # 依赖注入（get_db_session）
│       └── v1/
│           ├── __init__.py
│           ├── router.py             # v1 聚合路由
│           ├── health.py             # GET /api/v1/health 健康检查
│           └── patients.py           # POST/GET /api/v1/patients 样例 CRUD
├── alembic/
│   ├── env.py                        # async Alembic env（关键：异步配置）
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial.py           # 初始迁移：patient_profiles 表
├── tests/
│   ├── __init__.py
│   ├── conftest.py                   # pytest fixtures（SQLite in-memory + 异步 client）
│   ├── test_health.py
│   └── test_patients.py
├── pyproject.toml                    # 项目元信息 + 依赖 + Ruff + pytest 配置
├── .env.example                      # 环境变量模板
├── .gitignore
├── .python-version                   # 3.12
└── README.md
```

### 二、根级配置

#### 2.1 `pyproject.toml`

**职责**：声明项目元信息、依赖、Ruff/pytest 工具配置（集中管理，不额外建 `ruff.toml`/`pytest.ini`）。

```toml
[project]
name = "tremorguard-backend"
version = "0.1.0"
description = "TremorGuard 后端服务 — 帕金森震颤监测数据同步与报告服务"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.29.0",
    "sqlalchemy[asyncio]>=2.0.29",
    "asyncpg>=0.29.0",            # PostgreSQL async driver
    "alembic>=1.13.1",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.2.0",   # 环境变量配置
    "python-dotenv>=1.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.1.0",
    "pytest-asyncio>=0.23.0",
    "httpx>=0.27.0",              # FastAPI TestClient 异步支持
    "aiosqlite>=0.20.0",          # SQLite async driver（测试用）
    "ruff>=0.4.0",
]

[tool.ruff]
target-version = "py312"
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP", "B", "ASYNC"]

[tool.ruff.format]
quote-style = "double"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**版本锁定说明**：
- Python 3.12（用户指定，支持最新类型语法与性能改进）
- FastAPI 0.110+（原生 Pydantic v2 支持）
- SQLAlchemy 2.0+（全新 async API）
- Pydantic 2.6+（v2 性能与 API 稳定）
- Ruff 0.4+（替代 flake8 + isort + black）

#### 2.2 `.python-version`

```
3.12
```

#### 2.3 `.env.example`

```env
# 数据库（生产用 PostgreSQL）
DATABASE_URL=postgresql+asyncpg://tremorguard:tremorguard@localhost:5432/tremorguard

# 测试用 SQLite（conftest.py 中自动覆盖）
# DATABASE_URL=sqlite+aiosqlite:///:memory:

# 应用
APP_NAME=TremorGuard Backend
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8000

# CORS（前端 Origin）
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:8081
```

#### 2.4 `.gitignore`（新增，Python 专用）

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so

# Virtual env
.venv/
venv/
env/

# Distribution
build/
dist/
*.egg-info/

# Testing
.pytest_cache/
.coverage
htmlcov/

# Env
.env
.env.local

# IDE
.vscode/
.idea/
.DS_Store

# Alembic
alembic/versions/__pycache__/
```

### 三、核心配置层（`app/core/`）

#### 3.1 `app/core/config.py` — Pydantic Settings

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # 应用
    app_name: str = "TremorGuard Backend"
    app_env: str = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # 数据库
    database_url: str = "postgresql+asyncpg://tremorguard:tremorguard@localhost:5432/tremorguard"

    # CORS
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
```

#### 3.2 `app/core/database.py` — SQLAlchemy 2.0 Async

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.app_debug,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

#### 3.3 `app/core/exceptions.py` — 自定义异常

```python
from fastapi import Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, resource: str, resource_id: str):
        self.resource = resource
        self.resource_id = resource_id


class ConflictError(Exception):
    def __init__(self, message: str, client_version: int | None = None):
        self.message = message
        self.client_version = client_version


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "code": "NOT_FOUND",
            "message": f"{exc.resource} with id '{exc.resource_id}' not found",
        },
    )


async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "code": "CONFLICT",
            "message": exc.message,
            "details": {"clientVersion": exc.client_version} if exc.client_version else None,
        },
    )
```

### 四、数据模型层（`app/models/`）

#### 4.1 `app/models/base.py` — 声明基类 + 公共 Mixin

```python
from datetime import datetime

from sqlalchemy import DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 声明基类"""
    pass


class TimestampMixin:
    """时间戳混入 —— 对应前端 schema 中的 created_at / updated_at"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class SyncMixin:
    """同步混入 —— 对应前端 schema 中的 client_version / synced"""
    client_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    synced: Mapped[bool] = mapped_column(default=False, nullable=False)
```

#### 4.2 `app/models/patient.py` — PatientProfile ORM

**关键**：镜像前端 `storage-core/src/schema/migrations.ts` 中 `patient_profiles` 表的列定义，确保同步引擎数据一致。

```python
from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SyncMixin, TimestampMixin


class PatientProfile(Base, TimestampMixin, SyncMixin):
    """患者档案 —— 对应前端 PatientProfile 领域模型"""

    __tablename__ = "patient_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # male/female/other
    birth_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO 8601 date
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    diagnosis: Mapped[dict] = mapped_column(JSON, nullable=False)
    medication_plan: Mapped[list | None] = mapped_column(JSON, nullable=True)
```

**与前端 schema 的列映射**（来自 `migrations.ts` 第 82-96 行）：

| 前端 SQLite 列 | 后端 SQLAlchemy 列 | 类型 | 说明 |
|---|---|---|---|
| id | id | String(36) PK | UUID |
| name | name | String(100) | 真实姓名 |
| gender | gender | String(10) | male/female/other |
| birth_date | birth_date | String(10) | ISO 8601 date |
| phone | phone | String(20) | 联系电话 |
| emergency_contact | emergency_contact | JSON | 紧急联系人 |
| diagnosis | diagnosis | JSON | 诊断信息 |
| medication_plan | medication_plan | JSON | 用药方案 |
| created_at | created_at | DateTime | TimestampMixin |
| updated_at | updated_at | DateTime | TimestampMixin |
| client_version | client_version | Integer | SyncMixin |
| synced | synced | Boolean | SyncMixin |

### 五、Pydantic Schema 层（`app/schemas/`）

#### 5.1 `app/schemas/common.py` — 通用响应（对应 `contracts.ts`）

```python
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ApiError(BaseModel):
    """对应前端 contracts.ts 中的 ApiError"""
    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    details: dict[str, object] | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    """对应前端 contracts.ts 中的 PaginatedResponse<T>"""
    model_config = ConfigDict(populate_by_name=True)

    items: list[T]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
```

#### 5.2 `app/schemas/patient.py` — 患者请求/响应（对应 `contracts.ts`）

```python
from pydantic import BaseModel, ConfigDict, Field


class MedicationPlanItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    medication_name: str = Field(alias="medicationName")
    dosage_mg: float = Field(alias="dosageMg")
    schedule: list[str]
    active: bool


class DiagnosisSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    diagnosed_at: str = Field(alias="diagnosedAt")
    hoehn_yahr_stage: int = Field(alias="hoehnYahrStage", ge=1, le=5)
    primary_doctor_id: str | None = Field(default=None, alias="primaryDoctorId")


class PatientProfileSchema(BaseModel):
    """患者档案完整 schema —— 对应前端 PatientProfile"""
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    gender: str  # male/female/other
    birth_date: str = Field(alias="birthDate")
    phone: str | None = None
    emergency_contact: dict | None = Field(default=None, alias="emergencyContact")
    diagnosis: DiagnosisSchema
    medication_plan: list[MedicationPlanItemSchema] | None = Field(
        default=None, alias="medicationPlan"
    )
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    client_version: int = Field(alias="clientVersion")


class CreatePatientRequest(BaseModel):
    """对应前端 contracts.ts CreatePatientRequest"""
    model_config = ConfigDict(populate_by_name=True)

    name: str
    gender: str  # male/female/other
    birth_date: str = Field(alias="birthDate")
    phone: str | None = None


class CreatePatientResponse(BaseModel):
    """对应前端 contracts.ts CreatePatientResponse"""
    model_config = ConfigDict(populate_by_name=True)

    patient: PatientProfileSchema
```

### 六、Repository 层（`app/repositories/`）

#### 6.1 `app/repositories/base.py` — 通用 Repository

**设计依据**：镜像前端 `storage-core/src/types.ts` 中的 `Repository<T, ID>` 接口（findById/findAll/save/delete/count）。

```python
from typing import Generic, TypeVar

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)
IdT = TypeVar("IdT")


class BaseRepository(Generic[ModelT, IdT]):
    """通用 Repository —— 镜像前端 storage-core Repository<T, ID> 接口"""

    def __init__(self, session: AsyncSession, model: type[ModelT]):
        self.session = session
        self.model = model

    async def find_by_id(self, id_: IdT) -> ModelT | None:
        return await self.session.get(self.model, id_)

    async def find_all(self, limit: int = 50, offset: int = 0) -> list[ModelT]:
        stmt = select(self.model).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, id_: IdT) -> bool:
        entity = await self.find_by_id(id_)
        if entity is None:
            return False
        await self.session.delete(entity)
        await self.session.flush()
        return True

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar_one()
```

#### 6.2 `app/repositories/patient.py`

```python
from app.models.patient import PatientProfile
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository[PatientProfile, str]):
    def __init__(self, session):
        super().__init__(session, PatientProfile)
```

### 七、Service 层（`app/services/`）

#### 7.1 `app/services/patient.py`

```python
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.patient import PatientProfile
from app.repositories.patient import PatientRepository
from app.schemas.patient import CreatePatientRequest, PatientProfileSchema


class PatientService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = PatientRepository(session)

    async def create_patient(self, request: CreatePatientRequest) -> PatientProfileSchema:
        patient = PatientProfile(
            id=str(uuid.uuid4()),
            name=request.name,
            gender=request.gender,
            birth_date=request.birth_date,
            phone=request.phone,
            diagnosis={  # 默认空诊断，待后续接口补全
                "diagnosedAt": "",
                "hoehnYahrStage": 1,
            },
        )
        await self.repo.save(patient)
        await self.session.commit()
        return PatientProfileSchema.model_validate(patient)

    async def get_patient(self, patient_id: str) -> PatientProfileSchema:
        patient = await self.repo.find_by_id(patient_id)
        if patient is None:
            raise NotFoundError("Patient", patient_id)
        return PatientProfileSchema.model_validate(patient)
```

### 八、API 层（`app/api/`）

#### 8.1 `app/api/deps.py`

```python
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session
```

#### 8.2 `app/api/v1/health.py`

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "tremorguard-backend"}
```

#### 8.3 `app/api/v1/patients.py` — 样例 CRUD

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.patient import CreatePatientRequest, CreatePatientResponse, PatientProfileSchema
from app.services.patient import PatientService

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=CreatePatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    request: CreatePatientRequest,
    session: AsyncSession = Depends(get_session),
):
    service = PatientService(session)
    patient = await service.create_patient(request)
    return CreatePatientResponse(patient=patient)


@router.get("/{patient_id}", response_model=CreatePatientResponse)
async def get_patient(
    patient_id: str,
    session: AsyncSession = Depends(get_session),
):
    service = PatientService(session)
    patient = await service.get_patient(patient_id)
    return CreatePatientResponse(patient=patient)
```

#### 8.4 `app/api/v1/router.py` — v1 聚合路由

```python
from fastapi import APIRouter

from app.api.v1 import health, patients

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(patients.router)
```

#### 8.5 `app/main.py` — 应用入口

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, conflict_handler, not_found_handler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动
    yield
    # 关闭
    from app.core.database import engine
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
    debug=settings.app_debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(NotFoundError, not_found_handler)
app.add_exception_handler(ConflictError, conflict_handler)

app.include_router(api_router)
```

### 九、Alembic 迁移配置

#### 9.1 `alembic/env.py`（异步配置关键）

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.engine import Configuration

from app.core.config import settings
from app.models.base import Base
import app.models.patient  # noqa: F401 — 确保模型被注册

config = Configuration()
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata

fileConfig(context.config.config_file_name)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

#### 9.2 `alembic/versions/0001_initial.py` — 初始迁移

```python
"""initial migration: patient_profiles

Revision ID: 0001
Revises:
Create Date: 2026-08-08
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patient_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("gender", sa.String(10), nullable=False),
        sa.Column("birth_date", sa.String(10), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("emergency_contact", sa.JSON, nullable=True),
        sa.Column("diagnosis", sa.JSON, nullable=False),
        sa.Column("medication_plan", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("client_version", sa.Integer, nullable=False, server_default="1"),
        sa.Column("synced", sa.Boolean, nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_table("patient_profiles")
```

### 十、测试层（`tests/`）

#### 10.1 `tests/conftest.py` — SQLite in-memory 测试隔离

```python
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import get_db_session
from app.main import app
from app.models.base import Base


@pytest.fixture
async def test_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def test_session(test_engine):
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(test_engine):
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)

    async def override_get_session():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db_session] = override_get_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

#### 10.2 `tests/test_health.py`

```python
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

#### 10.3 `tests/test_patients.py`

```python
async def test_create_patient(client):
    response = await client.post(
        "/api/v1/patients",
        json={
            "name": "张三",
            "gender": "male",
            "birthDate": "1955-03-15",
            "phone": "13800138000",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["patient"]["name"] == "张三"
    assert data["patient"]["gender"] == "male"
    assert data["patient"]["birthDate"] == "1955-03-15"
    assert data["patient"]["clientVersion"] == 1


async def test_get_patient(client):
    # 先创建
    create_resp = await client.post(
        "/api/v1/patients",
        json={"name": "李四", "gender": "female", "birthDate": "1960-08-20"},
    )
    patient_id = create_resp.json()["patient"]["id"]
    # 再查询
    response = await client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 200
    assert response.json()["patient"]["name"] == "李四"


async def test_get_patient_not_found(client):
    response = await client.get("/api/v1/patients/nonexistent-id")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"
```

---

## Assumptions & Decisions

### 关键决策

1. **数据库**：PostgreSQL（生产）+ SQLite in-memory（测试）。用户确认。测试用 SQLite 快速隔离，生产用 PostgreSQL 支持高频写入与 JSONB。注意：JSON 列在两种方言下均可用（SQLAlchemy `JSON` 类型自动适配），无需特殊处理。

2. **搭建范围**：纯脚手架 + 一个样例 CRUD（Patient）。用户确认。与前端 scaffold 计划风格一致，演示完整分层模式，不实现全部业务端点。

3. **目录位置**：`tremorguard-backend/`，与 `tremorguard-frontend/` 平级。后端独立工程，不嵌入前端 monorepo（技术栈完全不同，Python 不适合 pnpm workspace）。

4. **分层架构**：api → service → repository → model。镜像前端 `storage-core` 的 Repository 模式，确保前后端数据访问接口一致。

5. **ORM 模型镜像前端 schema**：`PatientProfile` 的表名 `patient_profiles` 与列名严格对应前端 `storage-core/src/schema/migrations.ts` 第 82-96 行定义，确保未来同步引擎数据一致。

6. **API 路由前缀**：`/api/v1/`，与前端 `network-adapter.ts` 中的 `DEFAULT_SYNC_ENDPOINTS`（`/api/v1/sync/push` 等）前缀一致。

7. **Pydantic v2 camelCase 兼容**：所有响应 schema 使用 `ConfigDict(populate_by_name=True)` + `Field(alias="...")`，使后端返回 camelCase（如 `birthDate`、`clientVersion`），与前端 TypeScript 接口直接兼容。

8. **异步贯穿**：SQLAlchemy 2.0 async + asyncpg + aiosqlite。FastAPI 全异步，适合未来 BLE 数据流 WebSocket 扩展。

9. **Python 版本**：3.12（用户指定）。使用 `str | None` 等新语法。

10. **不引入认证**：本阶段不实现 JWT/OAuth。脚手架阶段聚焦架构模式，认证作为后续 P0 任务。

### 假设

1. 假设开发机已预装 Python 3.12（通过 `.python-version` 锁定）
2. 假设 PostgreSQL 实例可选（开发阶段测试用 SQLite，PostgreSQL 仅在集成测试时需要）
3. 假设前端 `shared-types` 的 API 契约为最终契约，后端 schema 严格遵循
4. 假设本阶段不接入 Docker/CI（后续按需添加）
5. 假设 Alembic 初始迁移仅含 `patient_profiles` 表（样例），其余 7 张表在后续 P0 阶段补全

---

## Verification Steps

执行以下命令验证脚手架完整性：

1. **依赖安装**：
   ```bash
   cd tremorguard-backend
   python -m venv .venv && source .venv/bin/activate
   pip install -e ".[dev]"
   ```

2. **Lint 检查**：
   ```bash
   ruff check app/ tests/
   ruff format --check app/ tests/
   ```

3. **单元测试**（使用 SQLite in-memory，无需 PostgreSQL）：
   ```bash
   pytest -v
   ```
   预期：3 个测试全部通过（health / create_patient / get_patient / not_found）

4. **Alembic 迁移验证**（需 PostgreSQL）：
   ```bash
   alembic upgrade head
   alembic current  # 应显示 0001
   ```

5. **开发服务器启动**：
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   访问 `http://localhost:8000/api/v1/health` 返回 `{"status":"ok",...}`
   访问 `http://localhost:8000/docs` 查看 Swagger UI

6. **前端契约兼容性验证**：
   - 创建患者返回的 JSON 字段为 camelCase（`birthDate`、`clientVersion`、`createdAt`、`updatedAt`）
   - 响应结构匹配 `contracts.ts` 中的 `CreatePatientResponse`（`{ patient: PatientProfile }`）

7. **分层架构验证**：
   - `api/v1/patients.py` → `services/patient.py` → `repositories/patient.py` → `models/patient.py` 调用链完整
   - 依赖注入通过 `Depends(get_session)` 实现
   - 测试通过 `app.dependency_overrides` 覆盖数据库 session
