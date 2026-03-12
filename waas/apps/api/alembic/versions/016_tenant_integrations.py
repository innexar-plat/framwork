"""Tenant integrations table (per-tenant config, encrypted secrets).

Revision ID: 016
Revises: 015
Create Date: 2025-03-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "016"
down_revision: str | None = "015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenant_integrations",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("tenant_id", sa.String(32), nullable=False),
        sa.Column("integration_code", sa.String(50), nullable=False),
        sa.Column(
            "is_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("config_encrypted", sa.Text(), nullable=True),
        sa.Column("config_public", sa.Text(), nullable=True),
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
        sa.UniqueConstraint(
            "tenant_id",
            "integration_code",
            name="uq_tenant_integrations_tenant_code",
        ),
    )
    op.create_index(
        "ix_tenant_integrations_tenant_id",
        "tenant_integrations",
        ["tenant_id"],
    )


def downgrade() -> None:
    op.drop_table("tenant_integrations")
