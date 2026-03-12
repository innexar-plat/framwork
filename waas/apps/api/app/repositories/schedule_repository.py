"""Schedule item repository — all queries scoped by tenant_id."""

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ScheduleItem


class ScheduleRepository:
    """Data access for ScheduleItem. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, item_id: str, tenant_id: str) -> ScheduleItem | None:
        result = await self._db.execute(
            select(ScheduleItem).where(
                ScheduleItem.id == item_id,
                ScheduleItem.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        start_from: datetime | None = None,
        end_before: datetime | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ScheduleItem]:
        q = select(ScheduleItem).where(ScheduleItem.tenant_id == tenant_id)
        if start_from is not None:
            q = q.where(ScheduleItem.start_at >= start_from)
        if end_before is not None:
            q = q.where(ScheduleItem.end_at <= end_before)
        if status:
            q = q.where(ScheduleItem.status == status)
        q = q.order_by(ScheduleItem.start_at.asc()).limit(limit).offset(offset)
        result = await self._db.execute(q)
        return list(result.scalars().all())

    async def add(self, item: ScheduleItem) -> ScheduleItem:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def update(self, item: ScheduleItem) -> ScheduleItem:
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def delete(self, item: ScheduleItem) -> None:
        await self._db.delete(item)
        await self._db.flush()
