"""Tenant branding/site settings (logo, colors, SEO defaults).

Revision ID: 011
Revises: 010
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "011"
down_revision: str | None = "010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("logo_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("favicon_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("primary_color", sa.String(50), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("footer_text", sa.String(1000), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("timezone", sa.String(100), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("meta_title", sa.String(255), nullable=True),
    )
    op.add_column(
        "tenants",
        sa.Column("meta_description", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tenants", "meta_description")
    op.drop_column("tenants", "meta_title")
    op.drop_column("tenants", "timezone")
    op.drop_column("tenants", "footer_text")
    op.drop_column("tenants", "primary_color")
    op.drop_column("tenants", "favicon_url")
    op.drop_column("tenants", "logo_url")
