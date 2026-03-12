"""ProvisioningLog repository — add and list by briefing_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ProvisioningLog


class ProvisioningLogRepository:
    """Data access for ProvisioningLog."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def add(self, log: ProvisioningLog) -> ProvisioningLog:
        self._db.add(log)
        await self._db.flush()
        await self._db.refresh(log)
        return log

    async def list_by_briefing(self, briefing_id: str) -> list[ProvisioningLog]:
        result = await self._db.execute(
            select(ProvisioningLog)
            .where(ProvisioningLog.briefing_id == briefing_id)
            .order_by(ProvisioningLog.step_number)
        )
        return list(result.scalars().all())
