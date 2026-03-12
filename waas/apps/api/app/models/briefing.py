"""Briefing model — client onboarding form before provisioning."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class Briefing(Base, TimestampMixin):
    """Briefing: client data and site config before tenant provisioning."""

    __tablename__ = "briefings"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    client_name: Mapped[str] = mapped_column(String(200), nullable=False)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False)
    client_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    plan_code: Mapped[str] = mapped_column(String(50), nullable=False)
    niche_code: Mapped[str] = mapped_column(String(50), nullable=False)
    slug_requested: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    business_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    slogan: Mapped[str | None] = mapped_column(String(300), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    secondary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(50), nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    social_links: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    modules_requested: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    use_custom_domain: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    custom_domain_requested: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending", server_default="pending"
    )
    tenant_id: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    provisioned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
