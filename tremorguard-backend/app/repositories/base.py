from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base


class BaseRepository[ModelT: Base, IdT]:
    """通用 Repository —— 镜像前端 storage-core Repository<T, ID> 接口"""

    def __init__(self, session: AsyncSession, model: type[ModelT]):
        self.session = session
        self.model = model

    async def find_by_id(self, id_: IdT) -> ModelT | None:
        return await self.session.get(self.model, id_)

    async def find_all(self, limit: int = 50, offset: int = 0) -> list[ModelT]:
        stmt = select(self.model).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def save(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, id_: IdT) -> bool:
        entity = await self.find_by_id(id_)
        if entity is None:
            return False
        await self.session.delete(entity)
        await self.session.flush()
        return True

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model)
        result = await self.session.execute(stmt)
        return result.scalar_one()
