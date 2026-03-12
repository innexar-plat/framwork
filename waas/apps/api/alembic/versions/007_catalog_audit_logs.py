"""Catalog audit logs table (Phase 4).

Revision ID: 007
Revises: 006
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "007"
down_revision: str | None = "006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "catalog_audit_logs",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("user_id", sa.String(32), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(32), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_catalog_audit_logs_user_id", "catalog_audit_logs", ["user_id"])
    op.create_index(
        "ix_catalog_audit_logs_entity_type",
        "catalog_audit_logs",
        ["entity_type"],
    )


def downgrade() -> None:
    op.drop_table("catalog_audit_logs")
