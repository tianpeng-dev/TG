from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SyncMixin, TimestampMixin


class PatientProfile(Base, TimestampMixin, SyncMixin):
    """患者档案 —— 对应前端 PatientProfile 领域模型"""

    __tablename__ = "patient_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # male/female/other
    birth_date: Mapped[str] = mapped_column(String(10), nullable=False)  # ISO 8601 date
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    emergency_contact: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    diagnosis: Mapped[dict] = mapped_column(JSON, nullable=False)
    medication_plan: Mapped[list | None] = mapped_column(JSON, nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
