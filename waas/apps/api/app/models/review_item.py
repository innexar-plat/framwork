"""ReviewItem model — tenant-scoped reviews (manual or Google)."""

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class ReviewItem(Base, TimestampMixin):
    """Review: author, rating 1–5, text, source (manual/google), published, sort_order."""

    __tablename__ = "review_items"

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
    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    author_photo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="manual", server_default="manual")
    google_review_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
