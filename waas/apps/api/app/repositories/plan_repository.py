"""Plan repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Plan


class PlanRepository:
    """Data access for Plan."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, plan_id: str) -> Plan | None:
        result = await self._db.execute(select(Plan).where(Plan.id == plan_id))
        return result.scalars().first()

    async def get_by_code(self, code: str) -> Plan | None:
        result = await self._db.execute(select(Plan).where(Plan.code == code))
        return result.scalars().first()

    async def list_active(self) -> list[Plan]:
        result = await self._db.execute(
            select(Plan).where(Plan.is_active.is_(True)).order_by(Plan.sort_order, Plan.code)
        )
        return list(result.scalars().all())

    async def list_all(self) -> list[Plan]:
        result = await self._db.execute(select(Plan).order_by(Plan.sort_order, Plan.code))
        return list(result.scalars().all())

    async def add(self, plan: Plan) -> Plan:
        self._db.add(plan)
        await self._db.flush()
        await self._db.refresh(plan)
        return plan

    async def update(self, plan: Plan) -> Plan:
        await self._db.flush()
        await self._db.refresh(plan)
        return plan

    async def delete(self, plan: Plan) -> None:
        await self._db.delete(plan)
        await self._db.flush()
