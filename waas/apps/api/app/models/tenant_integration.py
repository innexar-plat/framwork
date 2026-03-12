"""TenantIntegration model — per-tenant integration config (encrypted secrets)."""

from sqlalchemy import Boolean, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class TenantIntegration(Base, TimestampMixin):
    """Integration config per tenant. config_encrypted stores secrets (Fernet)."""

    __tablename__ = "tenant_integrations"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id", "integration_code", name="uq_tenant_integrations_tenant_code"
        ),
    )

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    tenant_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    integration_code: Mapped[str] = mapped_column(String(50), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    config_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    config_public: Mapped[str | None] = mapped_column(Text, nullable=True)
