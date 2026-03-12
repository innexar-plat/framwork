"""Catalog audit log — who changed what in catalog admin."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, generate_uuid_hex


class CatalogAuditLog(Base):
    """One row per catalog change: plan, niche, module, matrix."""

    __tablename__ = "catalog_audit_logs"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    user_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
