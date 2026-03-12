"""Stripe product repository — list by tenant (read-only for tenant API)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import StripeProduct


class StripeProductRepository:
    """Data access for StripeProduct. All queries scoped by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_by_tenant(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[StripeProduct]:
        result = await self._db.execute(
            select(StripeProduct)
            .where(StripeProduct.tenant_id == tenant_id)
            .order_by(StripeProduct.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def get_by_id(self, product_id: str, tenant_id: str) -> StripeProduct | None:
        result = await self._db.execute(
            select(StripeProduct).where(
                StripeProduct.id == product_id,
                StripeProduct.tenant_id == tenant_id,
            )
        )
        return result.scalar_one_or_none()
