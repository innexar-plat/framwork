"""Site page repository — all queries scoped by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SitePage


class SitePageRepository:
    """Data access for SitePage. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, page_id: str, tenant_id: str) -> SitePage | None:
        result = await self._db.execute(
            select(SitePage).where(
                SitePage.id == page_id,
                SitePage.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def get_by_slug(self, slug: str, tenant_id: str) -> SitePage | None:
        result = await self._db.execute(
            select(SitePage).where(
                SitePage.slug == slug,
                SitePage.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SitePage]:
        q = select(SitePage).where(SitePage.tenant_id == tenant_id)
        if status:
            q = q.where(SitePage.status == status)
        q = (
            q.order_by(SitePage.sort_order.asc(), SitePage.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._db.execute(q)
        return list(result.scalars().all())

    async def add(self, page: SitePage) -> SitePage:
        self._db.add(page)
        await self._db.flush()
        await self._db.refresh(page)
        return page

    async def update(self, page: SitePage) -> SitePage:
        self._db.add(page)
        await self._db.flush()
        await self._db.refresh(page)
        return page

    async def delete(self, page: SitePage) -> None:
        await self._db.delete(page)
        await self._db.flush()
