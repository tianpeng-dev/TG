from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MedicationPlanItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    medication_name: str = Field(alias="medicationName")
    dosage_mg: float = Field(alias="dosageMg")
    schedule: list[str]
    active: bool


class DiagnosisSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    diagnosed_at: str = Field(alias="diagnosedAt")
    hoehn_yahr_stage: int = Field(alias="hoehnYahrStage", ge=1, le=5)
    primary_doctor_id: str | None = Field(default=None, alias="primaryDoctorId")


class PatientProfileSchema(BaseModel):
    """患者档案完整 schema —— 对应前端 PatientProfile"""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    name: str
    gender: str  # male/female/other
    birth_date: str = Field(alias="birthDate")
    phone: str | None = None
    emergency_contact: dict | None = Field(default=None, alias="emergencyContact")
    diagnosis: DiagnosisSchema
    medication_plan: list[MedicationPlanItemSchema] | None = Field(
        default=None, alias="medicationPlan"
    )
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    client_version: int = Field(alias="clientVersion")


class CreatePatientRequest(BaseModel):
    """对应前端 contracts.ts CreatePatientRequest"""

    model_config = ConfigDict(populate_by_name=True)

    name: str
    gender: str  # male/female/other
    birth_date: str = Field(alias="birthDate")
    phone: str | None = None


class CreatePatientResponse(BaseModel):
    """对应前端 contracts.ts CreatePatientResponse"""

    model_config = ConfigDict(populate_by_name=True)

    patient: PatientProfileSchema
