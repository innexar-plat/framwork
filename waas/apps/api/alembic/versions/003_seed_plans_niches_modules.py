"""Seed plans, niches, modules and plan_niche_modules (Phase 2).

Revision ID: 003
Revises: 002
Create Date: 2025-03-09

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Deterministic 32-char IDs for seed data
PLAN_STARTER = "10000000000000000000000000000001"
PLAN_BUSINESS = "10000000000000000000000000000002"
PLAN_PRO = "10000000000000000000000000000003"

NICHE_HOUSE_CLEANING = "20000000000000000000000000000001"
NICHE_CONSTRUCTION = "20000000000000000000000000000002"
NICHE_LANDSCAPING = "20000000000000000000000000000003"
NICHE_PRESSURE_WASHING = "20000000000000000000000000000004"
NICHE_AUTO_DETAILING = "20000000000000000000000000000005"
NICHE_ROOFING = "20000000000000000000000000000006"
NICHE_DENTISTS = "20000000000000000000000000000007"

MODULE_BLOG = "30000000000000000000000000000001"
MODULE_LEADS = "30000000000000000000000000000002"
MODULE_SCHEDULE = "30000000000000000000000000000003"
MODULE_MEDIA = "30000000000000000000000000000004"
MODULE_PROPERTY = "30000000000000000000000000000005"


def upgrade() -> None:
    op.execute(
        f"""
        INSERT INTO plans (id, code, name, description, sort_order, is_active)
        VALUES
            ('{PLAN_STARTER}', 'starter', 'Starter', 'Starter plan', 1, true),
            ('{PLAN_BUSINESS}', 'business', 'Business', 'Business plan', 2, true),
            ('{PLAN_PRO}', 'pro', 'Pro', 'Pro plan', 3, true)
        """
    )
    op.execute(
        f"""
        INSERT INTO niches (id, code, name, parent_id, sort_order, is_active)
        VALUES
            ('{NICHE_HOUSE_CLEANING}', 'house_cleaning', 'House Cleaning', NULL, 1, true),
            ('{NICHE_CONSTRUCTION}', 'construction', 'Construction', NULL, 2, true),
            ('{NICHE_LANDSCAPING}', 'landscaping', 'Landscaping', NULL, 3, true),
            ('{NICHE_PRESSURE_WASHING}', 'pressure_washing', 'Pressure Washing', NULL, 4, true),
            ('{NICHE_AUTO_DETAILING}', 'auto_detailing', 'Auto Detailing', NULL, 5, true),
            ('{NICHE_ROOFING}', 'roofing', 'Roofing', NULL, 6, true),
            ('{NICHE_DENTISTS}', 'dentists', 'Dentists', NULL, 7, true)
        """
    )
    op.execute(
        f"""
        INSERT INTO modules (id, code, name, description, is_active)
        VALUES
            ('{MODULE_BLOG}', 'blog', 'Blog', 'Blog', true),
            ('{MODULE_LEADS}', 'leads', 'Leads', 'Leads/Forms', true),
            ('{MODULE_SCHEDULE}', 'schedule', 'Schedule', 'Schedule', true),
            ('{MODULE_MEDIA}', 'media', 'Media', 'Media', true),
            ('{MODULE_PROPERTY}', 'property', 'Property', 'Property', true)
        """
    )

    # PlanNicheModule: core (blog, leads, media) for every plan+niche; schedule for most; property for construction only
    conn = op.get_bind()
    plan_ids = [PLAN_STARTER, PLAN_BUSINESS, PLAN_PRO]
    niche_ids = [
        NICHE_HOUSE_CLEANING,
        NICHE_CONSTRUCTION,
        NICHE_LANDSCAPING,
        NICHE_PRESSURE_WASHING,
        NICHE_AUTO_DETAILING,
        NICHE_ROOFING,
        NICHE_DENTISTS,
    ]
    niches_with_schedule = [
        NICHE_HOUSE_CLEANING,
        NICHE_LANDSCAPING,
        NICHE_PRESSURE_WASHING,
        NICHE_AUTO_DETAILING,
        NICHE_DENTISTS,
        NICHE_ROOFING,
    ]
    niches_with_property = [NICHE_CONSTRUCTION]

    pnm = sa.table(
        "plan_niche_modules",
        sa.column("id", sa.String(32)),
        sa.column("plan_id", sa.String(32)),
        sa.column("niche_id", sa.String(32)),
        sa.column("module_id", sa.String(32)),
        sa.column("is_enabled", sa.Boolean()),
    )
    row_num = 0
    for plan_id in plan_ids:
        for niche_id in niche_ids:
            for mod_id in [MODULE_BLOG, MODULE_LEADS, MODULE_MEDIA]:
                row_num += 1
                conn.execute(
                    pnm.insert().values(
                        id=f"4{row_num:030d}",
                        plan_id=plan_id,
                        niche_id=niche_id,
                        module_id=mod_id,
                        is_enabled=True,
                    )
                )
            if niche_id in niches_with_schedule:
                row_num += 1
                conn.execute(
                    pnm.insert().values(
                        id=f"4{row_num:030d}",
                        plan_id=plan_id,
                        niche_id=niche_id,
                        module_id=MODULE_SCHEDULE,
                        is_enabled=True,
                    )
                )
            if niche_id in niches_with_property:
                row_num += 1
                conn.execute(
                    pnm.insert().values(
                        id=f"4{row_num:030d}",
                        plan_id=plan_id,
                        niche_id=niche_id,
                        module_id=MODULE_PROPERTY,
                        is_enabled=True,
                    )
                )


def downgrade() -> None:
    op.execute("DELETE FROM plan_niche_modules")
    op.execute("DELETE FROM modules")
    op.execute("DELETE FROM niches")
    op.execute("DELETE FROM plans")
