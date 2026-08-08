from datetime import timedelta

from app.core.security import create_access_token


async def test_register_success(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "PATIENT"
    assert "passwordHash" not in data["user"]
    assert "password_hash" not in data["user"]
    assert data["tokens"]["accessToken"]
    assert data["tokens"]["refreshToken"]
    assert data["tokens"]["tokenType"] == "bearer"


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "Password123!", "role": "PATIENT"}
    await client.post("/api/v1/auth/register", json=payload)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    assert response.json()["code"] == "CONFLICT"


async def test_login_success(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "login@example.com"
    assert data["tokens"]["accessToken"]


async def test_login_wrong_password(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpw@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


async def test_refresh_success(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "Password123!"},
    )
    refresh_token = login_resp.json()["tokens"]["refreshToken"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": refresh_token},
    )
    assert response.status_code == 200
    assert response.json()["tokens"]["accessToken"]

    # 旧 refresh token 应已失效（轮换）
    replay = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": refresh_token},
    )
    assert replay.status_code == 401


async def test_logout(client):
    await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "Password123!"},
    )
    refresh_token = login_resp.json()["tokens"]["refreshToken"]

    logout_resp = await client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": refresh_token},
    )
    assert logout_resp.status_code == 200
    assert logout_resp.json()["ok"] is True

    # 注销后 refresh 应失败
    refresh_resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": refresh_token},
    )
    assert refresh_resp.status_code == 401


async def test_access_token_expired(client):
    # 注册一个用户拿 user_id
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "expired@example.com", "password": "Password123!", "role": "PATIENT"},
    )
    user_id = reg_resp.json()["user"]["id"]

    # 生成已过期的 access token
    expired_token = create_access_token(
        user_id, "PATIENT", expires_delta=timedelta(seconds=-1)
    )
    client.headers["Authorization"] = f"Bearer {expired_token}"

    response = await client.get("/api/v1/me")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


async def test_invalid_token(client):
    client.headers["Authorization"] = "Bearer invalid.token.here"
    response = await client.get("/api/v1/me")
    assert response.status_code == 401


async def test_missing_token(client):
    response = await client.get("/api/v1/me")
    assert response.status_code == 401
