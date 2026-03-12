"""Schemas for tenant members / users API."""

from pydantic import BaseModel, EmailStr, Field


class TenantMemberOut(BaseModel):
    """Tenant member (user_tenant + user info)."""

    id: str  # user_tenant id
    user_id: str
    tenant_id: str
    role: str
    email: str
    name: str | None = None


class TenantMemberInvite(BaseModel):
    """Invite existing user to tenant by email."""

    email: EmailStr
    role: str = Field(default="member", max_length=50)


class TenantMemberRoleUpdate(BaseModel):
    """Update member role."""

    role: str = Field(..., min_length=1, max_length=50)
