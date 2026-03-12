"""Schedule API — CRUD for schedule items. Requires schedule module active."""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.schemas.common import ApiResponse
from app.schemas.schedule import (
    ScheduleItemCreate,
    ScheduleItemOut,
    ScheduleItemUpdate,
)
from app.services.schedule_service import ScheduleService

router = APIRouter()

TenantIdSchedule = Annotated[str, Depends(require_active_module("schedule"))]


def _item_to_out(item) -> ScheduleItemOut:
    return ScheduleItemOut(
        id=item.id,
        tenant_id=item.tenant_id,
        title=item.title,
        start_at=item.start_at,
        end_at=item.end_at,
        status=item.status,
        contact_name=item.contact_name,
        contact_email=item.contact_email,
        notes=item.notes,
    )


@router.get("/items", response_model=ApiResponse[list[ScheduleItemOut]])
async def list_items(
    db: DbSession,
    tenant_id: TenantIdSchedule,
    start_from: datetime | None = None,
    end_before: datetime | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[ScheduleItemOut]]:
    """List schedule items for the current tenant."""
    service = ScheduleService(db)
    items = await service.list_items(
        tenant_id,
        start_from=start_from,
        end_before=end_before,
        status=status,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(
        success=True,
        data=[_item_to_out(i) for i in items],
        error=None,
    )


@router.get("/items/{item_id}", response_model=ApiResponse[ScheduleItemOut])
async def get_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdSchedule,
) -> ApiResponse[ScheduleItemOut]:
    """Get a schedule item by id."""
    service = ScheduleService(db)
    item = await service.get_by_id(item_id, tenant_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule item not found",
        )
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.post(
    "/items",
    response_model=ApiResponse[ScheduleItemOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    body: ScheduleItemCreate,
    db: DbSession,
    tenant_id: TenantIdSchedule,
) -> ApiResponse[ScheduleItemOut]:
    """Create a schedule item."""
    service = ScheduleService(db)
    item = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.patch("/items/{item_id}", response_model=ApiResponse[ScheduleItemOut])
async def update_item(
    item_id: str,
    body: ScheduleItemUpdate,
    db: DbSession,
    tenant_id: TenantIdSchedule,
) -> ApiResponse[ScheduleItemOut]:
    """Update a schedule item."""
    service = ScheduleService(db)
    item = await service.update(item_id, tenant_id, body)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule item not found",
        )
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdSchedule,
) -> None:
    """Delete a schedule item."""
    service = ScheduleService(db)
    deleted = await service.delete(item_id, tenant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule item not found",
        )
