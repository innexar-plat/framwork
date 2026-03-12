"""Add users.global_role for catalog admin (Phase 4).

Revision ID: 006
Revises: 005
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "006"
down_revision: str | None = "005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("global_role", sa.String(50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "global_role")
