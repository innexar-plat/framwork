"""Schemas for tenant/site settings API."""

from datetime import datetime

from pydantic import BaseModel, Field


class TenantSettingsOut(BaseModel):
    """Tenant site settings (read)."""

    id: str
    name: str
    slug: str
    status: str
    logo_url: str | None = None
    favicon_url: str | None = None
    primary_color: str | None = None
    footer_text: str | None = None
    timezone: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


class TenantSettingsUpdate(BaseModel):
    """Update tenant site settings (partial)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    logo_url: str | None = Field(None, max_length=500)
    favicon_url: str | None = Field(None, max_length=500)
    primary_color: str | None = Field(None, max_length=50)
    footer_text: str | None = Field(None, max_length=1000)
    timezone: str | None = Field(None, max_length=100)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class TenantProvisioningUpdate(BaseModel):
    """Internal/API update for provisioning fields (admin only)."""

    subdomain: str | None = Field(None, max_length=100)
    custom_domain: str | None = Field(None, max_length=255)
    cf_record_id: str | None = Field(None, max_length=50)
    provisioning_status: str | None = Field(None, max_length=50)
    provisioned_at: datetime | None = None
    git_repo_url: str | None = Field(None, max_length=255)
    welcome_email_sent: bool | None = None
