"""Lead repository — all queries scoped by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Lead


class LeadRepository:
    """Data access for Lead. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, lead_id: str, tenant_id: str) -> Lead | None:
        result = await self._db.execute(
            select(Lead).where(
                Lead.id == lead_id,
                Lead.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Lead]:
        result = await self._db.execute(
            select(Lead)
            .where(Lead.tenant_id == tenant_id)
            .order_by(Lead.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def add(self, lead: Lead) -> Lead:
        self._db.add(lead)
        await self._db.flush()
        await self._db.refresh(lead)
        return lead
