"""Catalog API: plans, niches, modules (read-only)."""

from fastapi import APIRouter

from app.core.deps import DbSession
from app.schemas.catalog import ModuleOut, NicheOut, PlanOut
from app.schemas.common import ApiResponse
from app.services.catalog_service import CatalogService

router = APIRouter()


def _plan_to_out(plan) -> PlanOut:
    return PlanOut(
        id=plan.id,
        code=plan.code,
        name=plan.name,
        description=plan.description,
        sort_order=plan.sort_order,
        is_active=plan.is_active,
    )


def _niche_to_out(niche) -> NicheOut:
    return NicheOut(
        id=niche.id,
        code=niche.code,
        name=niche.name,
        parent_id=niche.parent_id,
        sort_order=niche.sort_order,
        is_active=niche.is_active,
    )


def _module_to_out(module) -> ModuleOut:
    return ModuleOut(
        id=module.id,
        code=module.code,
        name=module.name,
        description=module.description,
        is_active=module.is_active,
    )


@router.get("/plans", response_model=ApiResponse[list[PlanOut]])
async def list_plans(db: DbSession) -> ApiResponse[list[PlanOut]]:
    """List active plans."""
    catalog = CatalogService(db)
    plans = await catalog.list_plans()
    return ApiResponse(success=True, data=[_plan_to_out(p) for p in plans], error=None)


@router.get("/niches", response_model=ApiResponse[list[NicheOut]])
async def list_niches(db: DbSession) -> ApiResponse[list[NicheOut]]:
    """List active niches."""
    catalog = CatalogService(db)
    niches = await catalog.list_niches()
    return ApiResponse(success=True, data=[_niche_to_out(n) for n in niches], error=None)


@router.get("/modules", response_model=ApiResponse[list[ModuleOut]])
async def list_modules(db: DbSession) -> ApiResponse[list[ModuleOut]]:
    """List active modules."""
    catalog = CatalogService(db)
    modules = await catalog.list_modules()
    return ApiResponse(success=True, data=[_module_to_out(m) for m in modules], error=None)
