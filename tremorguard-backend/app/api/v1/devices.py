from fastapi import APIRouter, status

from app.api.deps import CurrentPatient, SessionDep
from app.schemas.device import (
    BindDeviceRequest,
    BindDeviceResponse,
    DeviceBindingSchema,
    DeviceListResponse,
    UnbindDeviceRequest,
)
from app.services.device import DeviceService

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("/bind", response_model=BindDeviceResponse, status_code=status.HTTP_201_CREATED)
async def bind_device(request: BindDeviceRequest, patient: CurrentPatient, session: SessionDep):
    service = DeviceService(session)
    return await service.bind_device(patient.id, request)


@router.post("/{device_id}/unbind", response_model=DeviceBindingSchema)
async def unbind_device(
    device_id: str,
    request: UnbindDeviceRequest,
    patient: CurrentPatient,
    session: SessionDep,
):
    service = DeviceService(session)
    return await service.unbind_device(patient.id, device_id, request.reason)


@router.get("", response_model=DeviceListResponse)
async def list_devices(patient: CurrentPatient, session: SessionDep):
    service = DeviceService(session)
    return await service.list_bindings(patient.id)
