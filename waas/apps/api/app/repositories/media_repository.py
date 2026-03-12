"""Media item repository — all queries scoped by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MediaItem


class MediaRepository:
    """Data access for MediaItem. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, item_id: str, tenant_id: str) -> MediaItem | None:
        result = await self._db.execute(
            select(MediaItem).where(
                MediaItem.id == item_id,
                MediaItem.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MediaItem]:
        result = await self._db.execute(
            select(MediaItem)
            .where(MediaItem.tenant_id == tenant_id)
            .order_by(MediaItem.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def add(self, item: MediaItem) -> MediaItem:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def delete(self, item: MediaItem) -> None:
        await self._db.delete(item)
        await self._db.flush()
