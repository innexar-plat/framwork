"""Property API — list/create/delete. Requires property module active."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.schemas.common import ApiResponse
from app.schemas.property import PropertyItemCreate, PropertyItemOut
from app.services.property_service import PropertyService

router = APIRouter()

TenantIdProperty = Annotated[str, Depends(require_active_module("property"))]


def _item_to_out(item) -> PropertyItemOut:
    return PropertyItemOut(
        id=item.id,
        tenant_id=item.tenant_id,
        title=item.title,
        address=item.address,
        status=item.status,
    )


@router.get("/items", response_model=ApiResponse[list[PropertyItemOut]])
async def list_items(
    db: DbSession,
    tenant_id: TenantIdProperty,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[PropertyItemOut]]:
    """List property items for the current tenant."""
    service = PropertyService(db)
    items = await service.list_items(tenant_id, limit=limit, offset=offset)
    return ApiResponse(
        success=True,
        data=[_item_to_out(i) for i in items],
        error=None,
    )


@router.get("/items/{item_id}", response_model=ApiResponse[PropertyItemOut])
async def get_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdProperty,
) -> ApiResponse[PropertyItemOut]:
    """Get a property item by id."""
    service = PropertyService(db)
    item = await service.get_by_id(item_id, tenant_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property item not found",
        )
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.post(
    "/items",
    response_model=ApiResponse[PropertyItemOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    body: PropertyItemCreate,
    db: DbSession,
    tenant_id: TenantIdProperty,
) -> ApiResponse[PropertyItemOut]:
    """Create a property item."""
    service = PropertyService(db)
    item = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdProperty,
) -> None:
    """Delete a property item."""
    service = PropertyService(db)
    deleted = await service.delete(item_id, tenant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property item not found",
        )
