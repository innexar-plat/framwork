"""Initial schema: tenants, users, user_tenants, integration_apps, workspace_externals.

Revision ID: 001
Revises:
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tenants",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("plan_id", sa.String(32), nullable=True),
        sa.Column("niche_id", sa.String(32), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_tenants",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "user_id", sa.String(32), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "tenant_id",
            sa.String(32),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(50), nullable=False, server_default="member"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_user_tenants_user_id", "user_tenants", ["user_id"])
    op.create_index("ix_user_tenants_tenant_id", "user_tenants", ["tenant_id"])

    op.create_table(
        "integration_apps",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("public_key", sa.String(64), nullable=False),
        sa.Column("secret_key_hash", sa.String(64), nullable=False),
        sa.Column("app_name", sa.String(255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_integration_apps_public_key", "integration_apps", ["public_key"], unique=True
    )

    op.create_table(
        "workspace_externals",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column(
            "tenant_id",
            sa.String(32),
            sa.ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("external_workspace_id", sa.String(255), nullable=False),
        sa.Column("source", sa.String(100), nullable=False, server_default="billing_v1"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_workspace_externals_tenant_id", "workspace_externals", ["tenant_id"], unique=True
    )
    op.create_index(
        "ix_workspace_externals_external_workspace_id",
        "workspace_externals",
        ["external_workspace_id"],
    )
    op.create_unique_constraint(
        "uq_workspace_external_source",
        "workspace_externals",
        ["external_workspace_id", "source"],
    )


def downgrade() -> None:
    op.drop_table("workspace_externals")
    op.drop_table("integration_apps")
    op.drop_table("user_tenants")
    op.drop_table("users")
    op.drop_table("tenants")
