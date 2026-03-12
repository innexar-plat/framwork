"""PlanNicheModule — which modules are enabled per (plan, niche)."""

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, generate_uuid_hex


class PlanNicheModule(Base):
    """Junction: plan + niche -> module enabled."""

    __tablename__ = "plan_niche_modules"
    __table_args__ = (
        UniqueConstraint("plan_id", "niche_id", "module_id", name="uq_plan_niche_module"),
    )

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    plan_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    niche_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("niches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    module_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    plan = relationship("Plan", back_populates="plan_niche_modules")
    niche = relationship("Niche", back_populates="plan_niche_modules")
    module = relationship("Module", back_populates="plan_niche_modules")
