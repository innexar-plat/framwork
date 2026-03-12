"""ProvisioningLog model — per-step log for tenant provisioning."""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class ProvisioningLog(Base, TimestampMixin):
    """One log entry per provisioning step (success/failed/skipped)."""

    __tablename__ = "provisioning_logs"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    briefing_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    step_name: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # success | failed | skipped
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
