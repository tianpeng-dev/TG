import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.deps import get_session
from app.core.security import hash_device_key
from app.main import app
from app.models.base import Base
from app.models.device import Device  # noqa: F401 — 确保模型注册到 Base.metadata
from app.models.patient import PatientProfile  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401


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

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


async def _register_and_login(client, email="test@example.com", password="Password123!"):
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "PATIENT"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    tokens = resp.json()["tokens"]
    client.headers["Authorization"] = f"Bearer {tokens['accessToken']}"
    return tokens


@pytest.fixture
async def auth_client(client):
    """注册+登录后返回带 Authorization header 的 client"""
    await _register_and_login(client)
    return client


@pytest.fixture
async def seed_device(test_session):
    """预置一个设备（带 device_key 哈希）供绑定测试使用"""
    device = Device(
        id=str(uuid.uuid4()),
        device_code="TEST-DEV-001",
        device_key_hash=hash_device_key("test-key-001"),
        name="Test Wristband",
        firmware_version="1.0.0",
        hardware_version="v1",
    )
    test_session.add(device)
    await test_session.commit()
    await test_session.refresh(device)
    return device
