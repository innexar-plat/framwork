"""Media API — list/create/delete/upload media items. Requires media module active."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.schemas.common import ApiResponse
from app.schemas.media import MediaItemCreate, MediaItemOut
from app.services.media_service import MediaService

router = APIRouter()

TenantIdMedia = Annotated[str, Depends(require_active_module("media"))]


def _item_to_out(item) -> MediaItemOut:
    return MediaItemOut(
        id=item.id,
        tenant_id=item.tenant_id,
        name=item.name,
        storage_key=item.storage_key,
        mime_type=item.mime_type,
        size_bytes=item.size_bytes,
    )


@router.get("/items", response_model=ApiResponse[list[MediaItemOut]])
async def list_items(
    db: DbSession,
    tenant_id: TenantIdMedia,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[MediaItemOut]]:
    """List media items for the current tenant."""
    service = MediaService(db)
    items = await service.list_items(tenant_id, limit=limit, offset=offset)
    return ApiResponse(
        success=True,
        data=[_item_to_out(i) for i in items],
        error=None,
    )


@router.get("/items/{item_id}", response_model=ApiResponse[MediaItemOut])
async def get_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdMedia,
) -> ApiResponse[MediaItemOut]:
    """Get a media item by id."""
    service = MediaService(db)
    item = await service.get_by_id(item_id, tenant_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media item not found",
        )
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.post(
    "/items",
    response_model=ApiResponse[MediaItemOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_item(
    body: MediaItemCreate,
    db: DbSession,
    tenant_id: TenantIdMedia,
) -> ApiResponse[MediaItemOut]:
    """Create a media item (metadata after upload)."""
    service = MediaService(db)
    item = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.post(
    "/upload",
    response_model=ApiResponse[MediaItemOut],
    status_code=status.HTTP_201_CREATED,
)
async def upload_file(
    db: DbSession,
    tenant_id: TenantIdMedia,
    file: UploadFile = File(...),
) -> ApiResponse[MediaItemOut]:
    """Upload a file; creates a media item with stored file."""
    content = await file.read()
    filename = file.filename or "upload"
    mime_type = file.content_type
    service = MediaService(db)
    try:
        item = await service.upload_file(tenant_id, content, filename, mime_type=mime_type)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    return ApiResponse(success=True, data=_item_to_out(item), error=None)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: str,
    db: DbSession,
    tenant_id: TenantIdMedia,
) -> None:
    """Delete a media item."""
    service = MediaService(db)
    deleted = await service.delete(item_id, tenant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media item not found",
        )
