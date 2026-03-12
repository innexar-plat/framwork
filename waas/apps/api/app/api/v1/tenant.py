"""Tenant/site settings API — GET and PATCH settings. Requires tenant in JWT."""

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import RequiredTenantId
from app.schemas.common import ApiResponse
from app.schemas.tenant import TenantSettingsOut, TenantSettingsUpdate
from app.services.tenant_service import TenantService

router = APIRouter()


def _to_out(t) -> TenantSettingsOut:
    return TenantSettingsOut(
        id=t.id,
        name=t.name,
        slug=t.slug,
        status=t.status,
        logo_url=getattr(t, "logo_url", None),
        favicon_url=getattr(t, "favicon_url", None),
        primary_color=getattr(t, "primary_color", None),
        footer_text=getattr(t, "footer_text", None),
        timezone=getattr(t, "timezone", None),
        meta_title=getattr(t, "meta_title", None),
        meta_description=getattr(t, "meta_description", None),
    )


@router.get("/settings", response_model=ApiResponse[TenantSettingsOut])
async def get_settings(
    tenant_id: RequiredTenantId,
    db: DbSession,
) -> ApiResponse[TenantSettingsOut]:
    """Get current tenant site settings."""
    service = TenantService(db)
    tenant = await service.get_settings(tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return ApiResponse(success=True, data=_to_out(tenant), error=None)


@router.patch("/settings", response_model=ApiResponse[TenantSettingsOut])
async def update_settings(
    tenant_id: RequiredTenantId,
    body: TenantSettingsUpdate,
    db: DbSession,
) -> ApiResponse[TenantSettingsOut]:
    """Update current tenant site settings (partial)."""
    service = TenantService(db)
    tenant = await service.update_settings(tenant_id, body)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return ApiResponse(success=True, data=_to_out(tenant), error=None)
