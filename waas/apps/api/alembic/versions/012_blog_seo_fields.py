"""Blog post SEO fields (meta_title, meta_description).

Revision ID: 012
Revises: 011
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "012"
down_revision: str | None = "011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "blog_posts",
        sa.Column("meta_title", sa.String(255), nullable=True),
    )
    op.add_column(
        "blog_posts",
        sa.Column("meta_description", sa.String(500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("blog_posts", "meta_description")
    op.drop_column("blog_posts", "meta_title")
