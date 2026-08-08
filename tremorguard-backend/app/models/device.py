from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SyncMixin, TimestampMixin


class Device(Base, TimestampMixin):
    """设备 —— 存设备凭证（device_key_hash）+ 元数据"""

    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    device_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    device_key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    firmware_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hardware_version: Mapped[str | None] = mapped_column(String(50), nullable=True)


class DeviceBinding(Base, TimestampMixin, SyncMixin):
    """设备绑定关系 —— 对齐前端 WristbandBinding，支持绑定生命周期与审计"""

    __tablename__ = "device_bindings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(36), nullable=False)
    patient_id: Mapped[str] = mapped_column(String(36), nullable=False)
    bound_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    unbound_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="active")
    unbound_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
