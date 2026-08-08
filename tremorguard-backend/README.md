# TremorGuard Backend

帕金森震颤监测智能腕带后端服务。基于 Python 3.12 + FastAPI + Pydantic v2 + SQLAlchemy 2 (async) + Alembic + Uvicorn + Ruff + pytest。

## 技术栈

- **FastAPI** — 异步 Web 框架
- **Pydantic v2** — 数据校验与序列化
- **SQLAlchemy 2.0** — 异步 ORM（PostgreSQL 生产 / SQLite 测试）
- **Alembic** — 数据库迁移
- **Uvicorn** — ASGI 服务器
- **Ruff** — Lint + 格式化
- **pytest** — 测试框架

## 快速开始

```bash
cd tremorguard-backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env

# 运行测试（SQLite in-memory，无需 PostgreSQL）
pytest -v

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

访问 `http://localhost:8000/docs` 查看 Swagger UI。

## 项目结构

```
app/
├── core/          # 配置、数据库、异常
├── models/        # SQLAlchemy ORM 模型
├── schemas/       # Pydantic 请求/响应 schema
├── repositories/  # 数据访问层（Repository 模式）
├── services/      # 业务逻辑层
└── api/v1/        # API 路由
alembic/           # 数据库迁移
tests/             # 测试
```

## 分层架构

api → service → repository → model

- **API 层**：接收请求，调用 Service，返回响应
- **Service 层**：业务逻辑，编排 Repository
- **Repository 层**：数据访问，镜像前端 storage-core 的 Repository 接口
- **Model 层**：ORM 模型，镜像前端 schema

## 数据库迁移

```bash
# 应用迁移（需 PostgreSQL）
alembic upgrade head

# 查看当前版本
alembic current

# 创建新迁移
alembic revision --autogenerate -m "description"
```
