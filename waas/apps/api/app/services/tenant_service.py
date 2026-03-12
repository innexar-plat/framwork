"""Tenant service — get and update tenant/site settings."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.tenant_repository import TenantRepository
from app.schemas.tenant import TenantSettingsUpdate


class TenantService:
    """Business logic for tenant settings. Operations scoped by tenant_id from JWT."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = TenantRepository(db)

    async def get_settings(self, tenant_id: str):
        """Get tenant by id for settings (returns model or None)."""
        return await self._repo.get_by_id(tenant_id)

    async def update_settings(self, tenant_id: str, body: TenantSettingsUpdate):
        """Update tenant branding/settings. Returns updated tenant or None."""
        kwargs = body.model_dump(exclude_unset=True)
        if not kwargs:
            return await self._repo.get_by_id(tenant_id)
        return await self._repo.update(tenant_id, **kwargs)
