from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserSchema(BaseModel):
    """用户信息 —— 读 schema"""

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: str
    email: str
    role: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


class TokenPairSchema(BaseModel):
    """令牌对 —— access + refresh"""

    model_config = ConfigDict(populate_by_name=True)

    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    token_type: str = Field(alias="tokenType", default="bearer")
    expires_in: int = Field(alias="expiresIn")


class OnboardingStatusSchema(BaseModel):
    """Onboarding 状态 —— 由 /me 端点自动推导"""

    model_config = ConfigDict(populate_by_name=True)

    status: str  # PROFILE_PENDING / DEVICE_PENDING / COMPLETED
    has_profile: bool = Field(alias="hasProfile")
    has_device: bool = Field(alias="hasDevice")
