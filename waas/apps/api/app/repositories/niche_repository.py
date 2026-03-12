"""Niche repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Niche


class NicheRepository:
    """Data access for Niche."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, niche_id: str) -> Niche | None:
        result = await self._db.execute(select(Niche).where(Niche.id == niche_id))
        return result.scalars().first()

    async def get_by_code(self, code: str) -> Niche | None:
        result = await self._db.execute(select(Niche).where(Niche.code == code))
        return result.scalars().first()

    async def list_active(self) -> list[Niche]:
        result = await self._db.execute(
            select(Niche).where(Niche.is_active.is_(True)).order_by(Niche.sort_order, Niche.code)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Niche]:
        result = await self._db.execute(select(Niche).order_by(Niche.sort_order, Niche.code))
        return list(result.scalars().all())

    async def add(self, niche: Niche) -> Niche:
        self._db.add(niche)
        await self._db.flush()
        await self._db.refresh(niche)
        return niche

    async def update(self, niche: Niche) -> Niche:
        await self._db.flush()
        await self._db.refresh(niche)
        return niche

    async def delete(self, niche: Niche) -> None:
        await self._db.delete(niche)
        await self._db.flush()
