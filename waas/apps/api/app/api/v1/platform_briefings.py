"""Platform briefing and provisioning endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.core.catalog_admin import CatalogAdminUserId
from app.core.deps import DbSession
from app.repositories.provisioning_log_repository import ProvisioningLogRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.briefing import BriefingCreate, BriefingResponse, BriefingUpdate
from app.schemas.common import ApiResponse
from app.schemas.platform import (
    ProvisionRequest,
    ProvisionResultOut,
    ProvisionStatusResponse,
    ProvisionStepOut,
)
from app.services.briefing_service import BriefingService
from app.services.provisioning_service import ProvisioningService

from .platform_common import briefing_to_response

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/briefings", response_model=ApiResponse[list[BriefingResponse]])
async def list_briefings(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> ApiResponse[list[BriefingResponse]]:
    """List briefings (platform admin). Optional filter by status."""
    service = BriefingService(db)
    briefings = await service.list_all(status_filter=status, limit=limit, offset=offset)
    return ApiResponse(
        success=True,
        data=[briefing_to_response(briefing) for briefing in briefings],
        error=None,
    )


@router.post(
    "/briefings",
    response_model=ApiResponse[BriefingResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_briefing(
    body: BriefingCreate,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Create briefing (public onboarding flow)."""
    service = BriefingService(db)
    briefing = await service.create(body)
    return ApiResponse(success=True, data=briefing_to_response(briefing), error=None)


@router.get("/briefings/{briefing_id}", response_model=ApiResponse[BriefingResponse])
async def get_briefing(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Get briefing by id (platform admin)."""
    service = BriefingService(db)
    briefing = await service.get_by_id(briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return ApiResponse(success=True, data=briefing_to_response(briefing), error=None)


@router.patch("/briefings/{briefing_id}", response_model=ApiResponse[BriefingResponse])
async def update_briefing(
    briefing_id: str,
    body: BriefingUpdate,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Update briefing (platform admin)."""
    service = BriefingService(db)
    briefing = await service.update(briefing_id, body)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return ApiResponse(success=True, data=briefing_to_response(briefing), error=None)


@router.delete("/briefings/{briefing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_briefing(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> None:
    """Delete briefing (platform admin)."""
    service = BriefingService(db)
    deleted = await service.delete(briefing_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")


@router.post("/provision", response_model=ApiResponse[ProvisionResultOut])
async def provision_tenant(
    body: ProvisionRequest,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[ProvisionResultOut]:
    """Run provisioning for a briefing (platform admin)."""
    service = ProvisioningService(db)
    try:
        result = await service.provision(body.briefing_id, override_slug=body.override_slug)
        data = ProvisionResultOut(
            tenant_id=result.tenant_id,
            subdomain=result.subdomain,
            panel_url=result.panel_url,
            admin_email=result.admin_email,
        )
        return ApiResponse(success=True, data=data, error=None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.exception("Provisioning failed for briefing %s: %s", body.briefing_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Provisioning failed. Check server logs.",
        )


@router.get("/provision/{briefing_id}/status", response_model=ApiResponse[ProvisionStatusResponse])
async def get_provision_status(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[ProvisionStatusResponse]:
    """Get provisioning status and steps for a briefing (platform admin)."""
    briefing_service = BriefingService(db)
    briefing = await briefing_service.get_by_id(briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")

    log_repo = ProvisioningLogRepository(db)
    logs = await log_repo.list_by_briefing(briefing_id)

    tenant = None
    if briefing.tenant_id:
        tenant_repo = TenantRepository(db)
        tenant = await tenant_repo.get_by_id(briefing.tenant_id)

    data = ProvisionStatusResponse(
        briefing_status=briefing.status,
        provisioning_status=tenant.provisioning_status if tenant else None,
        tenant_id=briefing.tenant_id,
        steps=[
            ProvisionStepOut(
                step_number=log.step_number,
                step_name=log.step_name,
                status=log.status,
                message=log.message,
            )
            for log in logs
        ],
    )
    return ApiResponse(success=True, data=data, error=None)
