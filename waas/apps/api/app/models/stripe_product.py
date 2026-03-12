"""StripeProduct model — tenant-scoped Stripe product/price reference."""

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class StripeProduct(Base, TimestampMixin):
    """Stripe product/price linked to tenant (read from Stripe or synced)."""

    __tablename__ = "stripe_products"

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
    stripe_product_id: Mapped[str] = mapped_column(String(200), nullable=False)
    stripe_price_id: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    interval: Mapped[str] = mapped_column(String(10), nullable=False)
