"""Seed 脚本 —— 创建演示用户、患者档案、预置设备

运行：python scripts/seed.py
幂等：按 email / device_code 查重，已存在则跳过
"""

import asyncio
import uuid

from sqlalchemy import select

from app.core.database import async_session_factory
from app.core.security import hash_device_key, hash_password
from app.models.device import Device
from app.models.patient import PatientProfile
from app.models.user import User

# 明文凭证（仅供开发测试使用）
SEED_EMAIL = "patient@tremorguard.local"
SEED_PASSWORD = "Password123!"
SEED_DEVICE_CODE = "TG-WB-001"
SEED_DEVICE_KEY = "dev-secret-001"


async def seed() -> None:
    async with async_session_factory() as session:
        # 1. 用户
        existing_user = (
            await session.execute(select(User).where(User.email == SEED_EMAIL))
        ).scalar_one_or_none()
        if existing_user is None:
            user = User(
                id=str(uuid.uuid4()),
                email=SEED_EMAIL,
                password_hash=hash_password(SEED_PASSWORD),
                role="PATIENT",
            )
            session.add(user)
            await session.flush()
        else:
            user = existing_user
        print(f"[seed] 用户: {SEED_EMAIL} / {SEED_PASSWORD} (id={user.id})")

        # 2. 患者档案
        existing_profile = (
            await session.execute(
                select(PatientProfile).where(PatientProfile.user_id == user.id)
            )
        ).scalar_one_or_none()
        if existing_profile is None:
            profile = PatientProfile(
                id=str(uuid.uuid4()),
                name="张三",
                gender="male",
                birth_date="1955-03-15",
                phone="13800138000",
                diagnosis={"diagnosedAt": "", "hoehnYahrStage": 1},
                user_id=user.id,
            )
            session.add(profile)
            await session.flush()
        else:
            profile = existing_profile
        print(f"[seed] 患者档案: {profile.name} (id={profile.id})")

        # 3. 预置设备
        existing_device = (
            await session.execute(select(Device).where(Device.device_code == SEED_DEVICE_CODE))
        ).scalar_one_or_none()
        if existing_device is None:
            device = Device(
                id=str(uuid.uuid4()),
                device_code=SEED_DEVICE_CODE,
                device_key_hash=hash_device_key(SEED_DEVICE_KEY),
                name="TremorGuard 腕带",
                firmware_version="1.0.0",
                hardware_version="v1",
            )
            session.add(device)
        print(f"[seed] 设备: {SEED_DEVICE_CODE} / {SEED_DEVICE_KEY}")

        await session.commit()
    print("[seed] 完成")


if __name__ == "__main__":
    asyncio.run(seed())
