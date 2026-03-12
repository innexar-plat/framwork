"""Base model with common columns."""

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base  # noqa: F401 — re-exported for models


def generate_uuid_hex() -> str:
    return uuid4().hex


class TimestampMixin:
    """created_at, updated_at."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


def utc_now() -> datetime:
    return datetime.now(UTC)
