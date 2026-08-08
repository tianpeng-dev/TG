from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import TokenPairSchema, UserSchema


class RegisterRequest(BaseModel):
    """注册请求 —— 对应前端 RegisterRequest"""

    model_config = ConfigDict(populate_by_name=True)

    email: str
    password: str = Field(min_length=8)
    role: str = Field(default="PATIENT")


class RegisterResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: UserSchema
    tokens: TokenPairSchema


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    password: str


class LoginResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: UserSchema
    tokens: TokenPairSchema


class RefreshRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(alias="refreshToken")


class RefreshResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tokens: TokenPairSchema


class LogoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    refresh_token: str = Field(alias="refreshToken")
