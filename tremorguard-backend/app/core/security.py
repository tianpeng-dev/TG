"""安全工具 —— 密码/设备密钥哈希（bcrypt）、refresh token 哈希（sha256）、JWT 签发/校验"""

import hashlib
import uuid
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

# ---- 密码（bcrypt）----


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


# ---- 设备密钥（bcrypt，同密码）----


def hash_device_key(key: str) -> str:
    return hash_password(key)


def verify_device_key(key: str, hashed: str) -> bool:
    return verify_password(key, hashed)


# ---- Refresh token（sha256，高熵无需慢哈希）----


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---- JWT ----


def create_access_token(
    user_id: str, role: str, expires_delta: timedelta | None = None
) -> str:
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "iat": now,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(
    user_id: str, expires_delta: timedelta | None = None
) -> tuple[str, str]:
    """返回 (token, jti)；jti 用于 DB 记录关联"""
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(days=settings.refresh_token_expire_days))
    jti = str(uuid.uuid4())
    payload = {
        "sub": user_id,
        "jti": jti,
        "type": "refresh",
        "iat": now,
        "exp": expire,
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as e:
        raise UnauthorizedError(str(e)) from e
