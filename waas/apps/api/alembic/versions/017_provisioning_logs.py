"""Provisioning logs table (per-step status).

Revision ID: 017
Revises: 016
Create Date: 2025-03-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "017"
down_revision: str | None = "016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "provisioning_logs",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("briefing_id", sa.String(32), nullable=False),
        sa.Column("step_number", sa.Integer(), nullable=False),
        sa.Column("step_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_provisioning_logs_briefing_id",
        "provisioning_logs",
        ["briefing_id"],
    )


def downgrade() -> None:
    op.drop_table("provisioning_logs")
