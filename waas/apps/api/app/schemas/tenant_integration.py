"""Schemas for tenant integrations API (config with encrypted secrets)."""

from pydantic import BaseModel, Field


class IntegrationConfigSet(BaseModel):
    """Set integration config (public + optional secret data)."""

    public_data: dict | None = Field(default_factory=dict)
    secret_data: dict | None = Field(default_factory=dict)


class IntegrationResponse(BaseModel):
    """Integration response (never expose config_encrypted)."""

    integration_code: str
    is_enabled: bool
    configured: bool
    config_public: dict | None = None
