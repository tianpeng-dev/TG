"""认证服务 —— 注册、登录、刷新、注销"""

import re
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.user import UserRepository
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.schemas.user import TokenPairSchema, UserSchema

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

VALID_ROLES = {"PATIENT", "DOCTOR", "ADMIN", "CAREGIVER"}


class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.token_repo = RefreshTokenRepository(session)

    async def register(self, request: RegisterRequest) -> RegisterResponse:
        if not EMAIL_REGEX.match(request.email):
            raise UnauthorizedError("Invalid email format")
        if request.role not in VALID_ROLES:
            raise UnauthorizedError("Invalid role")

        existing = await self.user_repo.find_by_email(request.email)
        if existing is not None:
            raise ConflictError("Email already registered")

        user = User(
            id=str(uuid.uuid4()),
            email=request.email,
            password_hash=hash_password(request.password),
            role=request.role,
        )
        await self.user_repo.save(user)

        tokens = await self._issue_tokens(user)
        await self.session.commit()

        return RegisterResponse(
            user=UserSchema.model_validate(user),
            tokens=tokens,
        )

    async def login(self, request: LoginRequest) -> LoginResponse:
        user = await self.user_repo.find_by_email(request.email)
        if user is None or not verify_password(request.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        tokens = await self._issue_tokens(user)
        await self.session.commit()

        return LoginResponse(
            user=UserSchema.model_validate(user),
            tokens=tokens,
        )

    async def refresh(self, request: RefreshRequest) -> RefreshResponse:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")

        token_hash = hash_token(request.refresh_token)
        record = await self.token_repo.find_by_hash(token_hash)
        if record is None or record.revoked_at is not None:
            raise UnauthorizedError("Refresh token not found or revoked")

        now = datetime.now(UTC)
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            # SQLite 读回后丢失 tzinfo，需补齐以与 aware datetime 比较
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at < now:
            raise UnauthorizedError("Refresh token expired")

        user = await self.user_repo.find_by_id(payload["sub"])
        if user is None:
            raise UnauthorizedError("User not found")

        # 撤销旧 token（轮换，防重放）
        record.revoked_at = now
        await self.session.flush()

        tokens = await self._issue_tokens(user)
        await self.session.commit()

        return RefreshResponse(tokens=tokens)

    async def logout(self, request: LogoutRequest) -> None:
        try:
            decode_token(request.refresh_token)
        except UnauthorizedError:
            return  # 幂等：token 无效也视为已注销

        token_hash = hash_token(request.refresh_token)
        record = await self.token_repo.find_by_hash(token_hash)
        if record is not None and record.revoked_at is None:
            record.revoked_at = datetime.now(UTC)
        await self.session.commit()

    async def _issue_tokens(self, user: User) -> TokenPairSchema:
        access_token = create_access_token(user.id, user.role)
        refresh_token, jti = create_refresh_token(user.id)

        now = datetime.now(UTC)
        record = RefreshToken(
            id=jti,
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
        )
        await self.token_repo.save(record)

        return TokenPairSchema(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )
