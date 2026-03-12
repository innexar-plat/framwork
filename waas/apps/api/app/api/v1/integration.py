"""Integration API: provisionamento (workspaces) — API key auth. Rate limited."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.api_key_auth import get_integration_app
from app.core.deps import DbSession
from app.core.i18n import Locale, translate
from app.core.rate_limit import limiter
from app.models import IntegrationApp
from app.schemas.common import ApiResponse
from app.schemas.integration import (
    CreateWorkspaceRequest,
    UpdateWorkspaceRequest,
    WorkspaceResponse,
)
from app.services.integration_service import IntegrationService

router = APIRouter()
INTEGRATION_LIMIT = "30/minute"
IntegrationAppDep = Annotated[IntegrationApp, Depends(get_integration_app)]


def _workspace_response_from_display(
    tenant, we, plan_code: str | None, niche_code: str | None, modules: list[str]
) -> WorkspaceResponse:
    return WorkspaceResponse(
        tenant_id=tenant.id,
        slug=tenant.slug,
        external_workspace_id=we.external_workspace_id,
        name=tenant.name,
        status=tenant.status,
        plan_code=plan_code,
        niche_code=niche_code,
        modules=modules,
    )


@router.post("/workspaces", response_model=ApiResponse[WorkspaceResponse])
@limiter.limit(INTEGRATION_LIMIT)
async def create_workspace(
    request: Request,
    body: CreateWorkspaceRequest,
    db: DbSession,
    _app: IntegrationAppDep,
) -> ApiResponse[WorkspaceResponse]:
    """Create workspace (tenant). Idempotent by external_workspace_id."""
    service = IntegrationService(db)
    tenant, we, _admin = await service.create_workspace(body)
    plan_code, niche_code, modules = await service.get_workspace_display(tenant, we)
    return ApiResponse(
        success=True,
        data=_workspace_response_from_display(tenant, we, plan_code, niche_code, modules),
        error=None,
    )


@router.get("/workspaces/{external_id}", response_model=ApiResponse[WorkspaceResponse])
@limiter.limit(INTEGRATION_LIMIT)
async def get_workspace(
    request: Request,
    external_id: str,
    db: DbSession,
    _app: IntegrationAppDep,
    locale: Locale,
) -> ApiResponse[WorkspaceResponse]:
    """Get tenant by external_workspace_id."""
    service = IntegrationService(db)
    pair = await service.get_workspace_by_external_id(external_id)
    if not pair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate("integration.workspace_not_found", locale),
        )
    tenant, we = pair
    plan_code, niche_code, modules = await service.get_workspace_display(tenant, we)
    return ApiResponse(
        success=True,
        data=_workspace_response_from_display(tenant, we, plan_code, niche_code, modules),
        error=None,
    )


@router.patch("/workspaces/{external_id}", response_model=ApiResponse[WorkspaceResponse])
@limiter.limit(INTEGRATION_LIMIT)
async def update_workspace(
    request: Request,
    external_id: str,
    body: UpdateWorkspaceRequest,
    db: DbSession,
    _app: IntegrationAppDep,
    locale: Locale,
) -> ApiResponse[WorkspaceResponse]:
    """Update plan/nicho for workspace."""
    service = IntegrationService(db)
    tenant = await service.update_workspace(external_id, body)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate("integration.workspace_not_found", locale),
        )
    we = (await service.get_workspace_by_external_id(external_id))[1]
    plan_code, niche_code, modules = await service.get_workspace_display(tenant, we)
    return ApiResponse(
        success=True,
        data=_workspace_response_from_display(tenant, we, plan_code, niche_code, modules),
        error=None,
    )


@router.post("/workspaces/{external_id}/suspend", response_model=ApiResponse[WorkspaceResponse])
@limiter.limit(INTEGRATION_LIMIT)
async def suspend_workspace(
    request: Request,
    external_id: str,
    db: DbSession,
    _app: IntegrationAppDep,
    locale: Locale,
) -> ApiResponse[WorkspaceResponse]:
    """Suspend tenant (e.g. inadimplência)."""
    service = IntegrationService(db)
    tenant = await service.set_tenant_status(external_id, "suspended")
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate("integration.workspace_not_found", locale),
        )
    pair = await service.get_workspace_by_external_id(external_id)
    tenant, we = pair[0], pair[1]
    plan_code, niche_code, modules = await service.get_workspace_display(tenant, we)
    return ApiResponse(
        success=True,
        data=_workspace_response_from_display(tenant, we, plan_code, niche_code, modules),
        error=None,
    )


@router.post("/workspaces/{external_id}/reactivate", response_model=ApiResponse[WorkspaceResponse])
@limiter.limit(INTEGRATION_LIMIT)
async def reactivate_workspace(
    request: Request,
    external_id: str,
    db: DbSession,
    _app: IntegrationAppDep,
    locale: Locale,
) -> ApiResponse[WorkspaceResponse]:
    """Reactivate tenant."""
    service = IntegrationService(db)
    tenant = await service.set_tenant_status(external_id, "active")
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=translate("integration.workspace_not_found", locale),
        )
    pair = await service.get_workspace_by_external_id(external_id)
    tenant, we = pair[0], pair[1]
    plan_code, niche_code, modules = await service.get_workspace_display(tenant, we)
    return ApiResponse(
        success=True,
        data=_workspace_response_from_display(tenant, we, plan_code, niche_code, modules),
        error=None,
    )
