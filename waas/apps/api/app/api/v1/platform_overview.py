"""Platform admin overview endpoints."""

from fastapi import APIRouter

from app.core.catalog_admin import CatalogAdminUserId
from app.core.deps import DbSession
from app.repositories.catalog_audit_repository import CatalogAuditRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.common import ApiResponse
from app.schemas.platform import AuditLogItem, TenantListItem

router = APIRouter()


@router.get("/tenants", response_model=ApiResponse[list[TenantListItem]])
async def list_tenants(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    limit: int = 100,
) -> ApiResponse[list[TenantListItem]]:
    """List all tenants (platform admin only)."""
    repo = TenantRepository(db)
    tenants = await repo.list_all(limit=limit)
    items = [
        TenantListItem(
            id=tenant.id,
            name=tenant.name,
            slug=tenant.slug,
            status=tenant.status,
            plan_id=tenant.plan_id,
            niche_id=tenant.niche_id,
            created_at=tenant.created_at,
        )
        for tenant in tenants
    ]
    return ApiResponse(success=True, data=items, error=None)


@router.get("/audit", response_model=ApiResponse[list[AuditLogItem]])
async def list_audit(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    limit: int = 50,
) -> ApiResponse[list[AuditLogItem]]:
    """List recent catalog audit log entries (platform admin only)."""
    repo = CatalogAuditRepository(db)
    rows = await repo.list_recent(limit=limit)
    items = [
        AuditLogItem(
            id=row.id,
            user_id=row.user_id,
            action=row.action,
            entity_type=row.entity_type,
            entity_id=row.entity_id,
            details=row.details,
            created_at=row.created_at,
        )
        for row in rows
    ]
    return ApiResponse(success=True, data=items, error=None)
