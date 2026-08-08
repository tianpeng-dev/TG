from fastapi import APIRouter, status

from app.api.deps import SessionDep
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, session: SessionDep):
    service = AuthService(session)
    return await service.register(request)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, session: SessionDep):
    service = AuthService(session)
    return await service.login(request)


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(request: RefreshRequest, session: SessionDep):
    service = AuthService(session)
    return await service.refresh(request)


@router.post("/logout")
async def logout(request: LogoutRequest, session: SessionDep):
    service = AuthService(session)
    await service.logout(request)
    return {"ok": True}
