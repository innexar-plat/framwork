"""Tenant model — workspace/site in WaaS."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class Tenant(Base, TimestampMixin):
    """Tenant: one workspace/site. plan_id/niche_id; provisioning fields."""

    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    plan_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    niche_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favicon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    footer_text: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Provisioning
    subdomain: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )
    custom_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cf_record_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provisioning_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", server_default="pending"
    )
    provisioned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    git_repo_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    welcome_email_sent: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    user_tenants = relationship("UserTenant", back_populates="tenant", lazy="selectin")
    workspace_externals = relationship(
        "WorkspaceExternal", back_populates="tenant", lazy="selectin"
    )
