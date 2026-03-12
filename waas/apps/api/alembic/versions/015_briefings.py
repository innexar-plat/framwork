"""Briefings table (onboarding data before provisioning).

Revision ID: 015
Revises: 014
Create Date: 2025-03-12

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "015"
down_revision: str | None = "014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "briefings",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("client_name", sa.String(200), nullable=False),
        sa.Column("client_email", sa.String(255), nullable=False),
        sa.Column("client_phone", sa.String(50), nullable=True),
        sa.Column("plan_code", sa.String(50), nullable=False),
        sa.Column("niche_code", sa.String(50), nullable=False),
        sa.Column("slug_requested", sa.String(100), nullable=True),
        sa.Column("business_name", sa.String(200), nullable=False),
        sa.Column("business_description", sa.Text(), nullable=True),
        sa.Column("slogan", sa.String(300), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("primary_color", sa.String(7), nullable=True),
        sa.Column("secondary_color", sa.String(7), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(50), nullable=True),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("social_links", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("modules_requested", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "use_custom_domain",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("custom_domain_requested", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(50),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("tenant_id", sa.String(32), nullable=True),
        sa.Column("provisioned_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("ix_briefings_tenant_id", "briefings", ["tenant_id"])
    op.create_index("ix_briefings_status", "briefings", ["status"])
    op.create_index("ix_briefings_client_email", "briefings", ["client_email"])


def downgrade() -> None:
    op.drop_table("briefings")
