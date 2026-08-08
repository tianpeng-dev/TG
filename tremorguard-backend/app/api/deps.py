from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.core.exceptions import BadRequestError, UnauthorizedError
from app.core.security import decode_token
from app.models.patient import PatientProfile
from app.models.user import User
from app.repositories.patient import PatientRepository

security = HTTPBearer()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_db_session():
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
CredentialsDep = Annotated[HTTPAuthorizationCredentials, Depends(security)]


async def get_current_user(
    credentials: CredentialsDep,
    session: SessionDep,
) -> User:
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise UnauthorizedError("Invalid token type")

    user_id = payload.get("sub")
    if user_id is None:
        raise UnauthorizedError("Invalid token payload")

    user = await session.get(User, user_id)
    if user is None:
        raise UnauthorizedError("User not found")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_patient(
    user: CurrentUser,
    session: SessionDep,
) -> PatientProfile:
    repo = PatientRepository(session)
    profile = await repo.find_by_user_id(user.id)
    if profile is None:
        raise BadRequestError("Complete your patient profile first")
    return profile


CurrentPatient = Annotated[PatientProfile, Depends(get_current_patient)]
