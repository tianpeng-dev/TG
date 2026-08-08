async def _create_profile(client):
    """辅助：创建患者档案（需已登录）"""
    resp = await client.post(
        "/api/v1/patients",
        json={"name": "测试患者", "gender": "male", "birthDate": "1955-01-01"},
    )
    return resp.json()["patient"]["id"]


async def test_bind_device_success(auth_client, seed_device):
    await _create_profile(auth_client)
    response = await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["binding"]["status"] == "active"
    assert data["binding"]["deviceId"] == seed_device.id
    assert data["device"]["deviceCode"] == "TEST-DEV-001"


async def test_bind_device_wrong_key(auth_client, seed_device):
    await _create_profile(auth_client)
    response = await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "wrong-key"},
    )
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"


async def test_bind_device_already_bound(auth_client, seed_device):
    await _create_profile(auth_client)
    await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    response = await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    assert response.status_code == 409
    assert response.json()["code"] == "CONFLICT"


async def test_unbind_device(auth_client, seed_device):
    await _create_profile(auth_client)
    bind_resp = await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    device_id = bind_resp.json()["binding"]["deviceId"]

    response = await auth_client.post(
        f"/api/v1/devices/{device_id}/unbind",
        json={"reason": "device_replaced"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "unbound"
    assert response.json()["unboundReason"] == "device_replaced"


async def test_list_devices(auth_client, seed_device):
    await _create_profile(auth_client)
    await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    response = await auth_client.get("/api/v1/devices")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "active"


async def test_cross_user_device_access(client, seed_device):
    """用户 A 绑定设备，用户 B 尝试解绑 → 403"""
    from tests.conftest import _register_and_login

    # 用户 A
    await _register_and_login(client, email="userA@example.com")
    await _create_profile(client)
    bind_resp = await client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "TEST-DEV-001", "deviceKey": "test-key-001"},
    )
    device_id = bind_resp.json()["binding"]["deviceId"]

    # 用户 B
    await _register_and_login(client, email="userB@example.com")
    await _create_profile(client)

    # 用户 B 尝试解绑用户 A 的设备
    response = await client.post(
        f"/api/v1/devices/{device_id}/unbind",
        json={"reason": "other"},
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


async def test_bind_nonexistent_device(auth_client):
    await _create_profile(auth_client)
    response = await auth_client.post(
        "/api/v1/devices/bind",
        json={"deviceCode": "NONEXISTENT", "deviceKey": "any-key"},
    )
    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


async def test_devices_requires_profile(auth_client):
    """未创建患者档案时访问设备端点 → 400"""
    response = await auth_client.get("/api/v1/devices")
    assert response.status_code == 400
    assert response.json()["code"] == "BAD_REQUEST"
