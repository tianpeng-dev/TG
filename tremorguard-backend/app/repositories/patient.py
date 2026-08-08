from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import PatientProfile
from app.repositories.base import BaseRepository


class PatientRepository(BaseRepository[PatientProfile, str]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, PatientProfile)

    async def find_by_user_id(self, user_id: str) -> PatientProfile | None:
        stmt = select(PatientProfile).where(PatientProfile.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
