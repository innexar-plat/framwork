"""Schemas for integration API (provisionamento)."""

from pydantic import BaseModel, EmailStr, Field


class CreateWorkspaceRequest(BaseModel):
    """POST /api/v1/integration/workspaces body."""

    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9\-]+$")
    external_workspace_id: str = Field(..., min_length=1, max_length=255)
    plan_code: str | None = Field(None, max_length=50)
    niche_code: str | None = Field(None, max_length=50)
    admin_email: EmailStr | None = None
    admin_name: str | None = Field(None, max_length=255)


class UpdateWorkspaceRequest(BaseModel):
    """PATCH workspace: update plan/nicho."""

    plan_code: str | None = Field(None, max_length=50)
    niche_code: str | None = Field(None, max_length=50)


class WorkspaceResponse(BaseModel):
    """Workspace (tenant) data returned by integration API."""

    tenant_id: str
    slug: str
    external_workspace_id: str
    name: str
    status: str
    plan_code: str | None = None
    niche_code: str | None = None
    modules: list[str] = Field(default_factory=list)
