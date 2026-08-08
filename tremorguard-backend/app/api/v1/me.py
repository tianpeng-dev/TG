from fastapi import APIRouter

from app.api.deps import CurrentUser, SessionDep
from app.schemas.me import MeResponse
from app.services.me import MeService

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeResponse)
async def get_me(user: CurrentUser, session: SessionDep):
    service = MeService(session)
    return await service.get_me(user)
