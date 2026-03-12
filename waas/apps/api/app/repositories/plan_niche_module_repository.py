"""PlanNicheModule repository — active modules per (plan, niche)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Module, PlanNicheModule


class PlanNicheModuleRepository:
    """Data access for PlanNicheModule."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_active_module_codes(self, plan_id: str, niche_id: str) -> list[str]:
        """Return list of module codes enabled for (plan_id, niche_id)."""
        result = await self._db.execute(
            select(Module.code)
            .join(
                PlanNicheModule,
                PlanNicheModule.module_id == Module.id,
            )
            .where(
                PlanNicheModule.plan_id == plan_id,
                PlanNicheModule.niche_id == niche_id,
                PlanNicheModule.is_enabled.is_(True),
                Module.is_active.is_(True),
            )
        )
        return [row[0] for row in result.all()]

    async def list_all(self) -> list[PlanNicheModule]:
        result = await self._db.execute(
            select(PlanNicheModule).order_by(
                PlanNicheModule.plan_id,
                PlanNicheModule.niche_id,
                PlanNicheModule.module_id,
            )
        )
        return list(result.scalars().all())

    async def get_by_triple(
        self, plan_id: str, niche_id: str, module_id: str
    ) -> PlanNicheModule | None:
        result = await self._db.execute(
            select(PlanNicheModule).where(
                PlanNicheModule.plan_id == plan_id,
                PlanNicheModule.niche_id == niche_id,
                PlanNicheModule.module_id == module_id,
            )
        )
        return result.scalars().first()

    async def add(self, pnm: PlanNicheModule) -> PlanNicheModule:
        self._db.add(pnm)
        await self._db.flush()
        await self._db.refresh(pnm)
        return pnm

    async def delete(self, pnm: PlanNicheModule) -> None:
        await self._db.delete(pnm)
        await self._db.flush()
