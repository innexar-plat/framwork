"""Catalog admin service — CRUD for plans, niches, modules, matrix."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Module, Niche, Plan, PlanNicheModule
from app.repositories.catalog_audit_repository import CatalogAuditRepository
from app.repositories.module_repository import ModuleRepository
from app.repositories.niche_repository import NicheRepository
from app.repositories.plan_niche_module_repository import PlanNicheModuleRepository
from app.repositories.plan_repository import PlanRepository
from app.schemas.catalog import (
    MatrixRowCreate,
    ModuleCreate,
    ModuleUpdate,
    NicheCreate,
    NicheUpdate,
    PlanCreate,
    PlanUpdate,
)


class CatalogAdminService:
    """Admin CRUD for catalog. Optional audit when user_id set."""

    def __init__(self, db: AsyncSession, user_id: str | None = None) -> None:
        self._db = db
        self._user_id = user_id
        self._plan_repo = PlanRepository(db)
        self._niche_repo = NicheRepository(db)
        self._module_repo = ModuleRepository(db)
        self._pnm_repo = PlanNicheModuleRepository(db)
        self._audit_repo = CatalogAuditRepository(db) if user_id else None

    async def _audit(
        self,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        details: str | None = None,
    ) -> None:
        if self._audit_repo and self._user_id:
            await self._audit_repo.log(self._user_id, action, entity_type, entity_id, details)

    async def list_plans_all(self) -> list[Plan]:
        return await self._plan_repo.list_all()

    async def create_plan(self, body: PlanCreate) -> Plan:
        plan = Plan(
            id=uuid4().hex,
            code=body.code,
            name=body.name,
            description=body.description,
            sort_order=body.sort_order,
            is_active=body.is_active,
        )
        plan = await self._plan_repo.add(plan)
        await self._audit("created", "plan", plan.id, f"code={plan.code}")
        return plan

    async def update_plan(self, plan_id: str, body: PlanUpdate) -> Plan | None:
        plan = await self._plan_repo.get_by_id(plan_id)
        if not plan:
            return None
        if body.code is not None:
            plan.code = body.code
        if body.name is not None:
            plan.name = body.name
        if body.description is not None:
            plan.description = body.description
        if body.sort_order is not None:
            plan.sort_order = body.sort_order
        if body.is_active is not None:
            plan.is_active = body.is_active
        plan = await self._plan_repo.update(plan)
        await self._audit("updated", "plan", plan_id, None)
        return plan

    async def delete_plan(self, plan_id: str) -> bool:
        plan = await self._plan_repo.get_by_id(plan_id)
        if not plan:
            return False
        await self._plan_repo.delete(plan)
        await self._audit("deleted", "plan", plan_id, None)
        return True

    async def list_niches_all(self) -> list[Niche]:
        return await self._niche_repo.list_all()

    async def create_niche(self, body: NicheCreate) -> Niche:
        niche = Niche(
            id=uuid4().hex,
            code=body.code,
            name=body.name,
            parent_id=body.parent_id,
            sort_order=body.sort_order,
            is_active=body.is_active,
        )
        niche = await self._niche_repo.add(niche)
        await self._audit("created", "niche", niche.id, f"code={niche.code}")
        return niche

    async def update_niche(self, niche_id: str, body: NicheUpdate) -> Niche | None:
        niche = await self._niche_repo.get_by_id(niche_id)
        if not niche:
            return None
        if body.code is not None:
            niche.code = body.code
        if body.name is not None:
            niche.name = body.name
        if body.parent_id is not None:
            niche.parent_id = body.parent_id
        if body.sort_order is not None:
            niche.sort_order = body.sort_order
        if body.is_active is not None:
            niche.is_active = body.is_active
        niche = await self._niche_repo.update(niche)
        await self._audit("updated", "niche", niche_id, None)
        return niche

    async def delete_niche(self, niche_id: str) -> bool:
        niche = await self._niche_repo.get_by_id(niche_id)
        if not niche:
            return False
        await self._niche_repo.delete(niche)
        await self._audit("deleted", "niche", niche_id, None)
        return True

    async def list_modules_all(self) -> list[Module]:
        return await self._module_repo.list_all()

    async def create_module(self, body: ModuleCreate) -> Module:
        module = Module(
            id=uuid4().hex,
            code=body.code,
            name=body.name,
            description=body.description,
            is_active=body.is_active,
        )
        module = await self._module_repo.add(module)
        await self._audit("created", "module", module.id, f"code={module.code}")
        return module

    async def update_module(self, module_id: str, body: ModuleUpdate) -> Module | None:
        module = await self._module_repo.get_by_id(module_id)
        if not module:
            return None
        if body.code is not None:
            module.code = body.code
        if body.name is not None:
            module.name = body.name
        if body.description is not None:
            module.description = body.description
        if body.is_active is not None:
            module.is_active = body.is_active
        module = await self._module_repo.update(module)
        await self._audit("updated", "module", module_id, None)
        return module

    async def delete_module(self, module_id: str) -> bool:
        module = await self._module_repo.get_by_id(module_id)
        if not module:
            return False
        await self._module_repo.delete(module)
        await self._audit("deleted", "module", module_id, None)
        return True

    async def list_matrix(self) -> list[PlanNicheModule]:
        return await self._pnm_repo.list_all()

    async def create_matrix_row(self, body: MatrixRowCreate) -> PlanNicheModule | None:
        plan = await self._plan_repo.get_by_id(body.plan_id)
        niche = await self._niche_repo.get_by_id(body.niche_id)
        module = await self._module_repo.get_by_id(body.module_id)
        if not plan or not niche or not module:
            return None
        existing = await self._pnm_repo.get_by_triple(body.plan_id, body.niche_id, body.module_id)
        if existing:
            existing.is_enabled = body.is_enabled
            await self._db.flush()
            await self._db.refresh(existing)
            await self._audit(
                "updated",
                "matrix",
                existing.id,
                f"plan={body.plan_id},niche={body.niche_id},module={body.module_id}",
            )
            return existing
        pnm = PlanNicheModule(
            id=uuid4().hex,
            plan_id=body.plan_id,
            niche_id=body.niche_id,
            module_id=body.module_id,
            is_enabled=body.is_enabled,
        )
        pnm = await self._pnm_repo.add(pnm)
        await self._audit("created", "matrix", pnm.id, None)
        return pnm

    async def delete_matrix_row(self, plan_id: str, niche_id: str, module_id: str) -> bool:
        pnm = await self._pnm_repo.get_by_triple(plan_id, niche_id, module_id)
        if not pnm:
            return False
        pnm_id = pnm.id
        await self._pnm_repo.delete(pnm)
        await self._audit("deleted", "matrix", pnm_id, None)
        return True
