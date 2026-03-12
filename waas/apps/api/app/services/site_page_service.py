"""Site page service — CRUD for static pages scoped by tenant."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SitePage
from app.repositories.site_page_repository import SitePageRepository
from app.schemas.site_page import SitePageCreate, SitePageUpdate


class SitePageService:
    """Business logic for site pages. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = SitePageRepository(db)

    async def list_pages(
        self,
        tenant_id: str,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SitePage]:
        return await self._repo.list_by_tenant(tenant_id, status=status, limit=limit, offset=offset)

    async def get_by_id(self, page_id: str, tenant_id: str) -> SitePage | None:
        return await self._repo.get_by_id(page_id, tenant_id)

    async def create(self, tenant_id: str, body: SitePageCreate) -> SitePage:
        page = SitePage(
            id=uuid4().hex,
            tenant_id=tenant_id,
            title=body.title,
            slug=body.slug,
            content=body.content,
            status=body.status,
            sort_order=body.sort_order,
            meta_title=body.meta_title,
            meta_description=body.meta_description,
        )
        return await self._repo.add(page)

    async def update(self, page_id: str, tenant_id: str, body: SitePageUpdate) -> SitePage | None:
        page = await self._repo.get_by_id(page_id, tenant_id)
        if not page:
            return None
        if body.title is not None:
            page.title = body.title
        if body.slug is not None:
            page.slug = body.slug
        if body.content is not None:
            page.content = body.content
        if body.status is not None:
            page.status = body.status
        if body.sort_order is not None:
            page.sort_order = body.sort_order
        if body.meta_title is not None:
            page.meta_title = body.meta_title
        if body.meta_description is not None:
            page.meta_description = body.meta_description
        return await self._repo.update(page)

    async def delete(self, page_id: str, tenant_id: str) -> bool:
        page = await self._repo.get_by_id(page_id, tenant_id)
        if not page:
            return False
        await self._repo.delete(page)
        return True
