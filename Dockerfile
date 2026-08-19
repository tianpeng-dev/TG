FROM python:3.12-slim

WORKDIR /app

# 系统依赖（部分 Python 包编译需要 gcc）
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制后端项目文件（利用层缓存）
COPY tremorguard-backend/pyproject.toml tremorguard-backend/alembic.ini ./
COPY tremorguard-backend/app ./app
COPY tremorguard-backend/alembic ./alembic
COPY tremorguard-backend/scripts ./scripts

# 安装生产依赖
RUN pip install --no-cache-dir .

# Zeabur 注入 PORT 环境变量，默认 8000
ENV APP_HOST=0.0.0.0 \
    APP_PORT=8000 \
    PORT=8000

EXPOSE 8000

# 启动前执行数据库迁移，随后启动 uvicorn
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
