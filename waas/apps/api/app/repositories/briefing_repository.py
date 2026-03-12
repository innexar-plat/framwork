"""Briefing repository — list, get, create, update, delete."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Briefing


class BriefingRepository:
    """Data access for Briefing. No tenant scope (platform-level)."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, briefing_id: str) -> Briefing | None:
        result = await self._db.execute(
            select(Briefing).where(Briefing.id == briefing_id)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        status_filter: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Briefing]:
        q = select(Briefing).order_by(Briefing.created_at.desc())
        if status_filter:
            q = q.where(Briefing.status == status_filter)
        q = q.limit(limit).offset(offset)
        result = await self._db.execute(q)
        return list(result.scalars().all())

    async def slug_requested_exists(self, slug: str) -> bool:
        """True if any briefing has this slug_requested (pending/provisioning)."""
        from sqlalchemy import and_, func
        normalized = (slug or "").strip().lower()
        if not normalized:
            return True
        result = await self._db.execute(
            select(Briefing.id).where(
                and_(
                    Briefing.slug_requested.isnot(None),
                    func.lower(Briefing.slug_requested) == normalized,
                    Briefing.status.in_(["pending", "provisioning"]),
                )
            ).limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def add(self, briefing: Briefing) -> Briefing:
        self._db.add(briefing)
        await self._db.flush()
        await self._db.refresh(briefing)
        return briefing

    async def update(self, briefing: Briefing) -> Briefing:
        await self._db.flush()
        await self._db.refresh(briefing)
        return briefing

    async def delete(self, briefing: Briefing) -> None:
        await self._db.delete(briefing)
        await self._db.flush()
