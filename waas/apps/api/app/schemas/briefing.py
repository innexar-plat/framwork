"""Schemas for briefing API (onboarding / platform admin)."""

from datetime import datetime

from pydantic import BaseModel, Field


class BriefingCreate(BaseModel):
    """Create briefing (client/portal)."""

    client_name: str = Field(..., min_length=1, max_length=200)
    client_email: str = Field(..., max_length=255)
    client_phone: str | None = Field(None, max_length=50)
    plan_code: str = Field(..., max_length=50)
    niche_code: str = Field(..., max_length=50)
    slug_requested: str | None = Field(None, max_length=100)
    business_name: str = Field(..., min_length=1, max_length=200)
    business_description: str | None = Field(None, max_length=10000)
    slogan: str | None = Field(None, max_length=300)
    logo_url: str | None = Field(None, max_length=500)
    primary_color: str | None = Field(None, max_length=7)
    secondary_color: str | None = Field(None, max_length=7)
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=50)
    zip_code: str | None = Field(None, max_length=20)
    social_links: dict | None = None
    modules_requested: list[str] | None = None
    use_custom_domain: bool = False
    custom_domain_requested: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=5000)


class BriefingUpdate(BaseModel):
    """Update briefing (admin: status, tenant_id, provisioned_at)."""

    status: str | None = Field(None, max_length=50)
    tenant_id: str | None = Field(None, max_length=32)
    provisioned_at: datetime | None = None


class BriefingResponse(BaseModel):
    """Briefing response."""

    id: str
    client_name: str
    client_email: str
    client_phone: str | None
    plan_code: str
    niche_code: str
    slug_requested: str | None
    business_name: str
    business_description: str | None
    slogan: str | None
    logo_url: str | None
    primary_color: str | None
    secondary_color: str | None
    address: str | None
    city: str | None
    state: str | None
    zip_code: str | None
    social_links: dict | None
    modules_requested: list | None
    use_custom_domain: bool
    custom_domain_requested: str | None
    notes: str | None
    status: str
    tenant_id: str | None
    provisioned_at: datetime | None
    created_at: datetime
    updated_at: datetime
