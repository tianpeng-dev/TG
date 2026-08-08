"""设备服务 —— 绑定、解绑、列表"""

import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import verify_device_key
from app.models.device import DeviceBinding
from app.repositories.device import DeviceBindingRepository, DeviceRepository
from app.schemas.device import (
    BindDeviceRequest,
    BindDeviceResponse,
    DeviceBindingSchema,
    DeviceListResponse,
    DeviceSchema,
)


class DeviceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.device_repo = DeviceRepository(session)
        self.binding_repo = DeviceBindingRepository(session)

    async def bind_device(self, patient_id: str, request: BindDeviceRequest) -> BindDeviceResponse:
        device = await self.device_repo.find_by_device_code(request.device_code)
        if device is None:
            raise NotFoundError("Device", request.device_code)

        if not verify_device_key(request.device_key, device.device_key_hash):
            raise UnauthorizedError("Invalid device key")

        existing_binding = await self.binding_repo.find_active_by_device(device.id)
        if existing_binding is not None:
            raise ConflictError("Device already bound")

        binding = DeviceBinding(
            id=str(uuid.uuid4()),
            device_id=device.id,
            patient_id=patient_id,
            bound_at=datetime.now(UTC),
            status="active",
        )
        await self.binding_repo.save(binding)
        await self.session.commit()

        return BindDeviceResponse(
            binding=DeviceBindingSchema.model_validate(binding),
            device=DeviceSchema.model_validate(device),
        )

    async def unbind_device(
        self, patient_id: str, device_id: str, reason: str | None
    ) -> DeviceBindingSchema:
        binding = await self.binding_repo.find_active_by_device(device_id)
        if binding is None:
            raise NotFoundError("DeviceBinding", device_id)

        if binding.patient_id != patient_id:
            raise ForbiddenError("Not your device binding")

        binding.unbound_at = datetime.now(UTC)
        binding.status = "unbound"
        binding.unbound_reason = reason
        await self.session.commit()

        return DeviceBindingSchema.model_validate(binding)

    async def list_bindings(self, patient_id: str) -> DeviceListResponse:
        bindings = await self.binding_repo.find_all_by_patient(patient_id)
        return DeviceListResponse(
            items=[DeviceBindingSchema.model_validate(b) for b in bindings],
            total=len(bindings),
        )
