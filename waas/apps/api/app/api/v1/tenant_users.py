"""Tenant members API — list, invite, update role, remove. Write ops require admin."""

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DbSession, RoleFromToken
from app.core.module_guard import RequiredTenantId
from app.schemas.common import ApiResponse
from app.schemas.tenant_user import (
    TenantMemberInvite,
    TenantMemberOut,
    TenantMemberRoleUpdate,
)
from app.services.tenant_user_service import TenantUserService

router = APIRouter()

ADMIN_ROLE = "admin"


def _to_out(ut) -> TenantMemberOut:
    user = getattr(ut, "user", None)
    email = user.email if user else ""
    name = getattr(user, "name", None) if user else None
    return TenantMemberOut(
        id=ut.id,
        user_id=ut.user_id,
        tenant_id=ut.tenant_id,
        role=ut.role,
        email=email,
        name=name,
    )


def _require_admin(role: str | None) -> None:
    if role != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant admins can manage members",
        )


@router.get("/users", response_model=ApiResponse[list[TenantMemberOut]])
async def list_members(
    tenant_id: RequiredTenantId,
    db: DbSession,
) -> ApiResponse[list[TenantMemberOut]]:
    """List members of the current tenant."""
    service = TenantUserService(db)
    members = await service.list_members(tenant_id)
    return ApiResponse(
        success=True,
        data=[_to_out(m) for m in members],
        error=None,
    )


@router.post(
    "/users",
    response_model=ApiResponse[TenantMemberOut],
    status_code=status.HTTP_201_CREATED,
)
async def invite_member(
    tenant_id: RequiredTenantId,
    role: RoleFromToken,
    body: TenantMemberInvite,
    db: DbSession,
) -> ApiResponse[TenantMemberOut]:
    """Invite an existing user to the tenant by email. Admin only."""
    _require_admin(role)
    service = TenantUserService(db)
    ut, err = await service.invite_by_email(tenant_id, body.email, body.role)
    if err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err,
        )
    return ApiResponse(success=True, data=_to_out(ut), error=None)


@router.patch("/users/{user_tenant_id}", response_model=ApiResponse[TenantMemberOut])
async def update_member_role(
    user_tenant_id: str,
    tenant_id: RequiredTenantId,
    role: RoleFromToken,
    body: TenantMemberRoleUpdate,
    db: DbSession,
) -> ApiResponse[TenantMemberOut]:
    """Update a member's role. Admin only."""
    _require_admin(role)
    service = TenantUserService(db)
    ut = await service.update_role(user_tenant_id, tenant_id, body.role)
    if not ut:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    loaded = await service.get_member(ut.id, tenant_id)
    return ApiResponse(success=True, data=_to_out(loaded or ut), error=None)


@router.delete("/users/{user_tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    user_tenant_id: str,
    tenant_id: RequiredTenantId,
    role: RoleFromToken,
    db: DbSession,
) -> None:
    """Remove a member from the tenant. Admin only."""
    _require_admin(role)
    service = TenantUserService(db)
    deleted = await service.remove_member(user_tenant_id, tenant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
