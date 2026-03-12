"""Guard: require tenant and active module for tenant-scoped module routes."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.deps import DbSession, Locale, get_tenant_id_from_token
from app.core.i18n import translate
from app.services.catalog_service import CatalogService


def get_required_tenant_id(
    locale: Locale,
    tenant_id: str | None = Depends(get_tenant_id_from_token),
) -> str:
    """Require tenant_id from JWT; raise 403 if missing."""
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate("module_guard.tenant_required", locale),
        )
    return tenant_id


RequiredTenantId = Annotated[str, Depends(get_required_tenant_id)]


def require_active_module(module_code: str):
    """Return a dependency that requires the given module to be active for the tenant."""

    async def _require(
        tenant_id: RequiredTenantId,
        db: DbSession,
        locale: Locale,
    ) -> str:
        catalog = CatalogService(db)
        modules = await catalog.get_active_module_codes_for_tenant(tenant_id)
        if module_code not in modules:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=translate("module_guard.module_not_enabled", locale),
            )
        return tenant_id

    return _require
