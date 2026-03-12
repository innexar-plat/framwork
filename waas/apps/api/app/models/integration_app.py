"""IntegrationApp: API key credentials for provisionamento."""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, generate_uuid_hex


class IntegrationApp(Base):
    """API key (public_key + secret_hash) for integration API."""

    __tablename__ = "integration_apps"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=generate_uuid_hex,
    )
    public_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    secret_key_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    app_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
