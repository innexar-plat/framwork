"""Fix dev user email: admin@localhost is invalid for EmailStr; use admin@example.com.

Revision ID: 010
Revises: 009
Create Date: 2025-03-09

"""

from collections.abc import Sequence

from sqlalchemy import text

from alembic import op

revision: str = "010"
down_revision: str | None = "009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        text("UPDATE users SET email = :new_email WHERE email = :old_email"),
        {"new_email": "admin@example.com", "old_email": "admin@localhost"},
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        text("UPDATE users SET email = :old_email WHERE email = :new_email"),
        {"old_email": "admin@localhost", "new_email": "admin@example.com"},
    )
