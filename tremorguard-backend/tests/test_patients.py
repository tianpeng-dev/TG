async def test_create_patient(auth_client):
    response = await auth_client.post(
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


async def test_get_patient(auth_client):
    create_resp = await auth_client.post(
        "/api/v1/patients",
        json={"name": "李四", "gender": "female", "birthDate": "1960-08-20"},
    )
    patient_id = create_resp.json()["patient"]["id"]

    response = await auth_client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 200
    assert response.json()["patient"]["name"] == "李四"


async def test_get_patient_not_found(auth_client):
    response = await auth_client.get("/api/v1/patients/nonexistent-id")
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


async def test_get_patient_unauthorized(client):
    """无 token → 401"""
    response = await client.get("/api/v1/patients/some-id")
    assert response.status_code == 401


async def test_create_patient_unauthorized(client):
    response = await client.post(
        "/api/v1/patients",
        json={"name": "test", "gender": "male", "birthDate": "1955-01-01"},
    )
    assert response.status_code == 401


async def test_cross_user_patient_access(client):
    """用户 A 创建 profile，用户 B 访问 → 403"""
    from tests.conftest import _register_and_login

    # 用户 A 创建档案
    await _register_and_login(client, email="userA@example.com")
    create_resp = await client.post(
        "/api/v1/patients",
        json={"name": "用户A", "gender": "male", "birthDate": "1955-01-01"},
    )
    patient_id = create_resp.json()["patient"]["id"]

    # 用户 B 登录并尝试访问用户 A 的档案
    await _register_and_login(client, email="userB@example.com")
    response = await client.get(f"/api/v1/patients/{patient_id}")
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


async def test_duplicate_profile(auth_client):
    """同一用户创建两次档案 → 409"""
    await auth_client.post(
        "/api/v1/patients",
        json={"name": "张三", "gender": "male", "birthDate": "1955-01-01"},
    )
    response = await auth_client.post(
        "/api/v1/patients",
        json={"name": "李四", "gender": "female", "birthDate": "1960-01-01"},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "CONFLICT"
