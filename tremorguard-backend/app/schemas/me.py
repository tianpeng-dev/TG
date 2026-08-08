from pydantic import BaseModel, ConfigDict

from app.schemas.patient import PatientProfileSchema
from app.schemas.user import OnboardingStatusSchema, UserSchema


class MeResponse(BaseModel):
    """/me 响应 —— 用户信息 + onboarding 状态 + 患者档案（存在时）"""

    model_config = ConfigDict(populate_by_name=True)

    user: UserSchema
    onboarding: OnboardingStatusSchema
    patient: PatientProfileSchema | None = None
