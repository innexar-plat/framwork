"""WorkspaceExternal: link tenant <-> external workspace (billing)."""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class WorkspaceExternal(Base, TimestampMixin):
    """Maps tenant to external_workspace_id (idempotency + lookup)."""

    __tablename__ = "workspace_externals"
    __table_args__ = (
        UniqueConstraint("external_workspace_id", "source", name="uq_workspace_external_source"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=generate_uuid_hex,
    )
    tenant_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    external_workspace_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, default="billing_v1")

    tenant = relationship("Tenant", back_populates="workspace_externals")
