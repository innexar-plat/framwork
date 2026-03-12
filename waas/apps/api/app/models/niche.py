"""Niche model — vertical (e.g. House Cleaning, Dentists); parent_id for subnichos."""

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_uuid_hex


class Niche(Base):
    """Niche: business vertical. parent_id for subnichos."""

    __tablename__ = "niches"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        String(32),
        ForeignKey("niches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    parent = relationship("Niche", remote_side="Niche.id", back_populates="children")
    children = relationship("Niche", back_populates="parent")
    plan_niche_modules = relationship("PlanNicheModule", back_populates="niche", lazy="selectin")
