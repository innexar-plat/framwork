"""User model."""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid_hex


class User(Base, TimestampMixin):
    """User: global identity. Tenant association via UserTenant."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_uuid_hex,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    global_role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    user_tenants = relationship("UserTenant", back_populates="user", lazy="selectin")
