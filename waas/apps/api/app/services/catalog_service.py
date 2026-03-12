"""Catalog service: plans, niches, modules, active modules per tenant."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.module_repository import ModuleRepository
from app.repositories.niche_repository import NicheRepository
from app.repositories.plan_niche_module_repository import PlanNicheModuleRepository
from app.repositories.plan_repository import PlanRepository
from app.repositories.tenant_repository import TenantRepository


class CatalogService:
    """List plans, niches, modules; resolve plan/niche by code; active modules for tenant."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._plan_repo = PlanRepository(db)
        self._niche_repo = NicheRepository(db)
        self._module_repo = ModuleRepository(db)
        self._pnm_repo = PlanNicheModuleRepository(db)
        self._tenant_repo = TenantRepository(db)

    async def list_plans(self) -> list:
        return await self._plan_repo.list_active()

    async def list_niches(self) -> list:
        return await self._niche_repo.list_active()

    async def list_modules(self) -> list:
        return await self._module_repo.list_active()

    async def get_plan_id_by_code(self, code: str) -> str | None:
        plan = await self._plan_repo.get_by_code(code)
        return plan.id if plan else None

    async def get_plan_code_by_id(self, plan_id: str | None) -> str | None:
        if not plan_id:
            return None
        plan = await self._plan_repo.get_by_id(plan_id)
        return plan.code if plan else None

    async def get_niche_id_by_code(self, code: str) -> str | None:
        niche = await self._niche_repo.get_by_code(code)
        return niche.id if niche else None

    async def get_niche_code_by_id(self, niche_id: str | None) -> str | None:
        if not niche_id:
            return None
        niche = await self._niche_repo.get_by_id(niche_id)
        return niche.code if niche else None

    async def get_active_module_codes_for_tenant(self, tenant_id: str) -> list[str]:
        """Return module codes enabled for the tenant's plan + niche. Empty if no plan/niche."""
        tenant = await self._tenant_repo.get_by_id(tenant_id)
        if not tenant or not tenant.plan_id or not tenant.niche_id:
            return []
        return await self._pnm_repo.get_active_module_codes(tenant.plan_id, tenant.niche_id)
