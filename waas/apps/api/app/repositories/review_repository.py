"""Review repository — all queries scoped by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ReviewItem


class ReviewRepository:
    """Data access for ReviewItem. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, review_id: str, tenant_id: str) -> ReviewItem | None:
        result = await self._db.execute(
            select(ReviewItem).where(
                ReviewItem.id == review_id,
                ReviewItem.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        published_only: bool = False,
        draft_only: bool = False,
        limit: int = 100,
        offset: int = 0,
    ) -> list[ReviewItem]:
        q = (
            select(ReviewItem)
            .where(ReviewItem.tenant_id == tenant_id)
            .order_by(ReviewItem.sort_order.asc(), ReviewItem.created_at.desc())
        )
        if published_only:
            q = q.where(ReviewItem.is_published.is_(True))
        elif draft_only:
            q = q.where(ReviewItem.is_published.is_(False))
        result = await self._db.execute(q.limit(limit).offset(offset))
        return list(result.scalars().all())

    async def create(self, tenant_id: str, data: dict) -> ReviewItem:
        item = ReviewItem(
            tenant_id=tenant_id,
            author_name=data["author_name"],
            author_photo=data.get("author_photo"),
            rating=data["rating"],
            text=data["text"],
            source=data.get("source", "manual"),
            google_review_id=data.get("google_review_id"),
            is_published=data.get("is_published", False),
            sort_order=data.get("sort_order", 0),
        )
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def update(self, obj: ReviewItem, data: dict) -> ReviewItem:
        for key in ("author_name", "rating", "text", "author_photo", "is_published", "sort_order"):
            if key in data:
                setattr(obj, key, data[key])
        await self._db.flush()
        await self._db.refresh(obj)
        return obj

    async def delete(self, obj: ReviewItem) -> None:
        await self._db.delete(obj)
        await self._db.flush()

    async def reorder(self, tenant_id: str, ids: list[str]) -> None:
        for i, rid in enumerate(ids):
            item = await self.get_by_id(rid, tenant_id)
            if item:
                item.sort_order = i
        await self._db.flush()
