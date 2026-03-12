"""Module repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Module


class ModuleRepository:
    """Data access for Module."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, module_id: str) -> Module | None:
        result = await self._db.execute(select(Module).where(Module.id == module_id))
        return result.scalars().first()

    async def get_by_code(self, code: str) -> Module | None:
        result = await self._db.execute(select(Module).where(Module.code == code))
        return result.scalars().first()

    async def list_active(self) -> list[Module]:
        result = await self._db.execute(
            select(Module).where(Module.is_active.is_(True)).order_by(Module.code)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Module]:
        result = await self._db.execute(select(Module).order_by(Module.code))
        return list(result.scalars().all())

    async def add(self, module: Module) -> Module:
        self._db.add(module)
        await self._db.flush()
        await self._db.refresh(module)
        return module

    async def update(self, module: Module) -> Module:
        await self._db.flush()
        await self._db.refresh(module)
        return module

    async def delete(self, module: Module) -> None:
        await self._db.delete(module)
        await self._db.flush()
