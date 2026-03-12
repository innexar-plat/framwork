"""Module model — feature module (blog, leads, schedule, media)."""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_uuid_hex


class Module(Base):
    """Module: blog, leads, schedule, media, property."""

    __tablename__ = "modules"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    plan_niche_modules = relationship("PlanNicheModule", back_populates="module", lazy="selectin")
