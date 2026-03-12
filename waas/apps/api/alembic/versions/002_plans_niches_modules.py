"""Plans, niches, modules, plan_niche_modules (Phase 2).

Revision ID: 002
Revises: 001
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_plans_code", "plans", ["code"], unique=True)

    op.create_table(
        "niches",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "parent_id",
            sa.String(32),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_niches_code", "niches", ["code"], unique=True)
    op.create_index("ix_niches_parent_id", "niches", ["parent_id"])

    op.create_table(
        "modules",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_modules_code", "modules", ["code"], unique=True)

    op.create_table(
        "plan_niche_modules",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "plan_id", sa.String(32), sa.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "niche_id",
            sa.String(32),
            sa.ForeignKey("niches.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "module_id",
            sa.String(32),
            sa.ForeignKey("modules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_plan_niche_modules_plan_id", "plan_niche_modules", ["plan_id"])
    op.create_index("ix_plan_niche_modules_niche_id", "plan_niche_modules", ["niche_id"])
    op.create_index("ix_plan_niche_modules_module_id", "plan_niche_modules", ["module_id"])
    op.create_unique_constraint(
        "uq_plan_niche_module",
        "plan_niche_modules",
        ["plan_id", "niche_id", "module_id"],
    )


def downgrade() -> None:
    op.drop_table("plan_niche_modules")
    op.drop_table("modules")
    op.drop_table("niches")
    op.drop_table("plans")
