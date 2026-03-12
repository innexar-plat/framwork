"""Platform admin: tenants list, audit log, provision."""

from datetime import datetime

from pydantic import BaseModel, Field


class ProvisionRequest(BaseModel):
    """Request to provision a tenant from a briefing."""

    briefing_id: str = Field(..., min_length=1, max_length=32)
    override_slug: str | None = Field(None, max_length=100)


class ProvisionStepOut(BaseModel):
    """Single step in provisioning status."""

    step_number: int
    step_name: str
    status: str
    message: str | None


class ProvisionStatusResponse(BaseModel):
    """Provisioning status for a briefing."""

    briefing_status: str
    provisioning_status: str | None
    tenant_id: str | None
    steps: list[ProvisionStepOut]


class ProvisionResultOut(BaseModel):
    """Result of successful provisioning."""

    tenant_id: str
    subdomain: str
    panel_url: str
    admin_email: str


class TenantListItem(BaseModel):
    id: str
    name: str
    slug: str
    status: str
    plan_id: str | None
    niche_id: str | None
    created_at: datetime


class AuditLogItem(BaseModel):
    id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str | None
    details: str | None
    created_at: datetime


def _mask(s: str, visible: int = 4) -> str:
    """Mask secret: show last visible chars, rest as ***."""
    if not s or len(s) <= visible:
        return "***" if s else ""
    return "*" * (len(s) - visible) + s[-visible:]


class IntegrationSection(BaseModel):
    """One integration section (masked, no raw secrets)."""

    configured: bool
    zone_id: str | None = None
    base_domain: str | None = None
    cname_target: str | None = None
    token_masked: str | None = None


class GitSection(BaseModel):
    configured: bool
    template_owner: str | None = None
    template_repo: str | None = None
    token_masked: str | None = None


class SmtpSection(BaseModel):
    configured: bool
    host: str | None = None
    port: int | None = None
    from_address: str | None = None
    user_masked: str | None = None


class DomainSection(BaseModel):
    panel_base_url: str | None = None
    site_base_domain: str | None = None


class PlatformIntegrationsStatus(BaseModel):
    """Platform integrations status (masked). Never expose raw secrets."""

    cloudflare: IntegrationSection
    git: GitSection
    smtp: SmtpSection
    domain: DomainSection
