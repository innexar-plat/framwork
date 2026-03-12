"""Seed one dev user for admin login (dev only).

Revision ID: 009
Revises: 008
Create Date: 2025-03-09

Migration 010 updates email to admin@example.com (EmailStr rejects @localhost).
Use email: admin@example.com  password: Dev123!
"""

from collections.abc import Sequence

from passlib.context import CryptContext
from sqlalchemy import text

from alembic import op

revision: str = "009"
down_revision: str | None = "008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DEV_USER_ID = "00000000000000000000000000000001"
DEV_EMAIL = "admin@localhost"
DEV_PASSWORD_PLAIN = "Dev123!"
DEV_PASSWORD_HASH = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12).hash(
    DEV_PASSWORD_PLAIN
)


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        text(
            """
            INSERT INTO users (id, email, password_hash, name, global_role, created_at, updated_at)
            VALUES (
                :id,
                :email,
                :password_hash,
                :name,
                :global_role,
                NOW(),
                NOW()
            )
            ON CONFLICT (email) DO NOTHING
            """
        ),
        {
            "id": DEV_USER_ID,
            "email": DEV_EMAIL,
            "password_hash": DEV_PASSWORD_HASH,
            "name": "Dev Admin",
            "global_role": "catalog_admin",
        },
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": DEV_EMAIL})
