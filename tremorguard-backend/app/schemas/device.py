from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DeviceSchema(BaseModel):
    """设备信息 —— 读 schema"""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    device_code: str = Field(alias="deviceCode")
    name: str | None = None
    firmware_version: str | None = Field(alias="firmwareVersion")
    hardware_version: str | None = Field(alias="hardwareVersion")
    created_at: datetime = Field(alias="createdAt")


class DeviceBindingSchema(BaseModel):
    """设备绑定关系 —— 对齐前端 WristbandBinding"""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    device_id: str = Field(alias="deviceId")
    patient_id: str = Field(alias="patientId")
    bound_at: datetime = Field(alias="boundAt")
    unbound_at: datetime | None = Field(alias="unboundAt")
    status: str  # active / unbound
    unbound_reason: str | None = Field(alias="unboundReason")
    client_version: int = Field(alias="clientVersion")


class BindDeviceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    device_code: str = Field(alias="deviceCode")
    device_key: str = Field(alias="deviceKey")


class BindDeviceResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    binding: DeviceBindingSchema
    device: DeviceSchema


class UnbindDeviceRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    reason: str | None = None


class DeviceListResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[DeviceBindingSchema]
    total: int
