from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device import Device, DeviceBinding
from app.repositories.base import BaseRepository


class DeviceRepository(BaseRepository[Device, str]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Device)

    async def find_by_device_code(self, code: str) -> Device | None:
        stmt = select(Device).where(Device.device_code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class DeviceBindingRepository(BaseRepository[DeviceBinding, str]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, DeviceBinding)

    async def find_active_by_device(self, device_id: str) -> DeviceBinding | None:
        stmt = select(DeviceBinding).where(
            DeviceBinding.device_id == device_id,
            DeviceBinding.status == "active",
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_active_by_patient(self, patient_id: str) -> list[DeviceBinding]:
        stmt = select(DeviceBinding).where(
            DeviceBinding.patient_id == patient_id,
            DeviceBinding.status == "active",
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def find_all_by_patient(self, patient_id: str) -> list[DeviceBinding]:
        stmt = select(DeviceBinding).where(DeviceBinding.patient_id == patient_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
