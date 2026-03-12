"""Tenant repository."""

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tenant


class TenantRepository:
    """Data access for Tenant."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, tenant_id: str) -> Tenant | None:
        result = await self._db.execute(select(Tenant).where(Tenant.id == tenant_id))
        return result.scalar_one_or_none()

    async def list_all(self, limit: int = 100) -> list[Tenant]:
        result = await self._db.execute(
            select(Tenant).order_by(Tenant.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, slug: str) -> Tenant | None:
        result = await self._db.execute(select(Tenant).where(Tenant.slug == slug))
        return result.scalar_one_or_none()

    async def slug_or_subdomain_taken(self, slug: str) -> bool:
        """True if any tenant has slug or subdomain equal to normalized slug."""
        normalized = (slug or "").strip().lower()
        if not normalized:
            return False
        result = await self._db.execute(
            select(Tenant.id)
            .where(
                or_(
                    Tenant.slug == normalized,
                    Tenant.subdomain == normalized,
                )
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def add(self, tenant: Tenant) -> Tenant:
        self._db.add(tenant)
        await self._db.flush()
        await self._db.refresh(tenant)
        return tenant

    async def update(
        self,
        tenant_id: str,
        *,
        name: str | None = None,
        logo_url: str | None = None,
        favicon_url: str | None = None,
        primary_color: str | None = None,
        footer_text: str | None = None,
        timezone: str | None = None,
        meta_title: str | None = None,
        meta_description: str | None = None,
    ) -> Tenant | None:
        """Update tenant by id. Only non-None kwargs are applied."""
        tenant = await self.get_by_id(tenant_id)
        if not tenant:
            return None
        if name is not None:
            tenant.name = name
        if logo_url is not None:
            tenant.logo_url = logo_url
        if favicon_url is not None:
            tenant.favicon_url = favicon_url
        if primary_color is not None:
            tenant.primary_color = primary_color
        if footer_text is not None:
            tenant.footer_text = footer_text
        if timezone is not None:
            tenant.timezone = timezone
        if meta_title is not None:
            tenant.meta_title = meta_title
        if meta_description is not None:
            tenant.meta_description = meta_description
        self._db.add(tenant)
        await self._db.flush()
        await self._db.refresh(tenant)
        return tenant
