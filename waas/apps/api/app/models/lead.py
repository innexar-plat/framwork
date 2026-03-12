"""Lead model — leads/forms submissions scoped by tenant."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class Lead(Base, TimestampMixin):
    """Lead: tenant-scoped; name, email, source, message."""

    __tablename__ = "leads"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=True)
    message: Mapped[str] = mapped_column(String(2000), nullable=True)
