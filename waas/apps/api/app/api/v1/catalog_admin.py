"""Catalog admin API — CRUD plans, niches, modules, matrix. Requires catalog_admin role."""

from fastapi import APIRouter, HTTPException, status

from app.core.catalog_admin import CatalogAdminUserId
from app.core.deps import DbSession
from app.schemas.catalog import (
    MatrixRowCreate,
    MatrixRowOut,
    ModuleCreate,
    ModuleOut,
    ModuleUpdate,
    NicheCreate,
    NicheOut,
    NicheUpdate,
    PlanCreate,
    PlanOut,
    PlanUpdate,
)
from app.schemas.common import ApiResponse
from app.services.catalog_admin_service import CatalogAdminService

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


def _matrix_to_out(pnm) -> MatrixRowOut:
    return MatrixRowOut(
        id=pnm.id,
        plan_id=pnm.plan_id,
        niche_id=pnm.niche_id,
        module_id=pnm.module_id,
        is_enabled=pnm.is_enabled,
    )


# Plans
@router.get("/plans", response_model=ApiResponse[list[PlanOut]])
async def list_plans_admin(
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[list[PlanOut]]:
    """List all plans (including inactive)."""
    service = CatalogAdminService(db, user_id=user_id)
    plans = await service.list_plans_all()
    return ApiResponse(success=True, data=[_plan_to_out(p) for p in plans], error=None)


@router.post(
    "/plans",
    response_model=ApiResponse[PlanOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_plan(
    body: PlanCreate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[PlanOut]:
    """Create a plan."""
    service = CatalogAdminService(db, user_id=user_id)
    plan = await service.create_plan(body)
    return ApiResponse(success=True, data=_plan_to_out(plan), error=None)


@router.patch("/plans/{plan_id}", response_model=ApiResponse[PlanOut])
async def update_plan(
    plan_id: str,
    body: PlanUpdate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[PlanOut]:
    """Update a plan."""
    service = CatalogAdminService(db, user_id=user_id)
    plan = await service.update_plan(plan_id, body)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )
    return ApiResponse(success=True, data=_plan_to_out(plan), error=None)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> None:
    """Delete a plan."""
    service = CatalogAdminService(db, user_id=user_id)
    deleted = await service.delete_plan(plan_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found",
        )


# Niches
@router.get("/niches", response_model=ApiResponse[list[NicheOut]])
async def list_niches_admin(
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[list[NicheOut]]:
    """List all niches (including inactive)."""
    service = CatalogAdminService(db, user_id=user_id)
    niches = await service.list_niches_all()
    return ApiResponse(
        success=True,
        data=[_niche_to_out(n) for n in niches],
        error=None,
    )


@router.post(
    "/niches",
    response_model=ApiResponse[NicheOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_niche(
    body: NicheCreate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[NicheOut]:
    """Create a niche."""
    service = CatalogAdminService(db, user_id=user_id)
    niche = await service.create_niche(body)
    return ApiResponse(success=True, data=_niche_to_out(niche), error=None)


@router.patch("/niches/{niche_id}", response_model=ApiResponse[NicheOut])
async def update_niche(
    niche_id: str,
    body: NicheUpdate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[NicheOut]:
    """Update a niche."""
    service = CatalogAdminService(db, user_id=user_id)
    niche = await service.update_niche(niche_id, body)
    if not niche:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niche not found",
        )
    return ApiResponse(success=True, data=_niche_to_out(niche), error=None)


@router.delete("/niches/{niche_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_niche(
    niche_id: str,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> None:
    """Delete a niche."""
    service = CatalogAdminService(db, user_id=user_id)
    deleted = await service.delete_niche(niche_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niche not found",
        )


# Modules
@router.get("/modules", response_model=ApiResponse[list[ModuleOut]])
async def list_modules_admin(
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[list[ModuleOut]]:
    """List all modules (including inactive)."""
    service = CatalogAdminService(db, user_id=user_id)
    modules = await service.list_modules_all()
    return ApiResponse(
        success=True,
        data=[_module_to_out(m) for m in modules],
        error=None,
    )


@router.post(
    "/modules",
    response_model=ApiResponse[ModuleOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_module(
    body: ModuleCreate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[ModuleOut]:
    """Create a module."""
    service = CatalogAdminService(db, user_id=user_id)
    module = await service.create_module(body)
    return ApiResponse(success=True, data=_module_to_out(module), error=None)


@router.patch("/modules/{module_id}", response_model=ApiResponse[ModuleOut])
async def update_module(
    module_id: str,
    body: ModuleUpdate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[ModuleOut]:
    """Update a module."""
    service = CatalogAdminService(db, user_id=user_id)
    module = await service.update_module(module_id, body)
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )
    return ApiResponse(success=True, data=_module_to_out(module), error=None)


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: str,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> None:
    """Delete a module."""
    service = CatalogAdminService(db, user_id=user_id)
    deleted = await service.delete_module(module_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module not found",
        )


# Matrix Plan×Niche×Module
@router.get("/matrix", response_model=ApiResponse[list[MatrixRowOut]])
async def list_matrix(
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[list[MatrixRowOut]]:
    """List all plan×niche×module rows."""
    service = CatalogAdminService(db, user_id=user_id)
    rows = await service.list_matrix()
    return ApiResponse(
        success=True,
        data=[_matrix_to_out(r) for r in rows],
        error=None,
    )


@router.post(
    "/matrix",
    response_model=ApiResponse[MatrixRowOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_matrix_row(
    body: MatrixRowCreate,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> ApiResponse[MatrixRowOut]:
    """Enable a module for a plan+niche (or update is_enabled)."""
    service = CatalogAdminService(db, user_id=user_id)
    pnm = await service.create_matrix_row(body)
    if not pnm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan, niche or module not found",
        )
    return ApiResponse(success=True, data=_matrix_to_out(pnm), error=None)


@router.delete(
    "/matrix/{plan_id}/{niche_id}/{module_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_matrix_row(
    plan_id: str,
    niche_id: str,
    module_id: str,
    db: DbSession,
    user_id: CatalogAdminUserId,
) -> None:
    """Remove module from plan+niche."""
    service = CatalogAdminService(db, user_id=user_id)
    deleted = await service.delete_matrix_row(plan_id, niche_id, module_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matrix row not found",
        )
