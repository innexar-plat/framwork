"""Tenant new fields for provisioning (subdomain, DNS, Git, status).

Revision ID: 014
Revises: 013
Create Date: 2025-03-12

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "014"
down_revision: str | None = "013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("subdomain", sa.String(100), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("custom_domain", sa.String(255), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("cf_record_id", sa.String(50), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "provisioning_status",
            sa.String(50),
            nullable=False,
            server_default="pending",
        ),
    )
    op.add_column(
        "tenants",
        sa.Column("provisioned_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("git_repo_url", sa.String(255), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column(
            "welcome_email_sent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index(
        "ix_tenants_subdomain",
        "tenants",
        ["subdomain"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_tenants_subdomain", table_name="tenants")
    op.drop_column("tenants", "welcome_email_sent")
    op.drop_column("tenants", "git_repo_url")
    op.drop_column("tenants", "provisioned_at")
    op.drop_column("tenants", "provisioning_status")
    op.drop_column("tenants", "cf_record_id")
    op.drop_column("tenants", "custom_domain")
    op.drop_column("tenants", "subdomain")
