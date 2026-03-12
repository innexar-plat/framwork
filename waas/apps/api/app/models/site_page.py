"""SitePage model — static pages (About, Contact, etc.) scoped by tenant."""

from sqlalchemy import Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class SitePage(Base, TimestampMixin):
    """Static page: tenant-scoped; title, slug, content, status, order."""

    __tablename__ = "site_pages"
    __table_args__ = (UniqueConstraint("tenant_id", "slug", name="uq_site_pages_tenant_slug"),)

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    tenant_id: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    content: Mapped[str | None] = mapped_column(String(50_000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="draft")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
