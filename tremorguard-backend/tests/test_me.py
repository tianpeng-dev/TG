async def test_me_profile_pending(auth_client):
    """刚注册，无 profile → PROFILE_PENDING"""
    response = await auth_client.get("/api/v1/me")
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding"]["status"] == "PROFILE_PENDING"
    assert data["onboarding"]["hasProfile"] is False
    assert data["onboarding"]["hasDevice"] is False
    assert data["patient"] is None


async def test_me_device_pending(auth_client):
    """创建 profile 后 → DEVICE_PENDING"""
    await auth_client.post(
        "/api/v1/patients",
        json={"name": "测试患者", "gender": "male", "birthDate": "1955-01-01"},
    )
    response = await auth_client.get("/api/v1/me")
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding"]["status"] == "DEVICE_PENDING"
    assert data["onboarding"]["hasProfile"] is True
    assert data["onboarding"]["hasDevice"] is False
    assert data["patient"]["name"] == "测试患者"


async def test_me_completed(auth_client, seed_device):
    """绑定设备后 → COMPLETED"""
    # 1. 创建患者档案
    await auth_client.post(
        "/api/v1/patients",
        json={"name": "测试患者", "gender": "male", "birthDate": "1955-01-01"},
    )
    # 2. 绑定设备
    await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    # 3. 检查 onboarding
    response = await auth_client.get("/api/v1/me")
    assert response.status_code == 200
    data = response.json()
    assert data["onboarding"]["status"] == "COMPLETED"
    assert data["onboarding"]["hasProfile"] is True
    assert data["onboarding"]["hasDevice"] is True
