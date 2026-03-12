"""Site pages API — CRUD for static pages. Requires tenant in JWT."""

from fastapi import APIRouter, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import RequiredTenantId
from app.schemas.common import ApiResponse
from app.schemas.site_page import SitePageCreate, SitePageOut, SitePageUpdate
from app.services.site_page_service import SitePageService

router = APIRouter()


def _page_to_out(p) -> SitePageOut:
    return SitePageOut(
        id=p.id,
        tenant_id=p.tenant_id,
        title=p.title,
        slug=p.slug,
        content=p.content,
        status=p.status,
        sort_order=p.sort_order,
        meta_title=getattr(p, "meta_title", None),
        meta_description=getattr(p, "meta_description", None),
    )


@router.get("/pages", response_model=ApiResponse[list[SitePageOut]])
async def list_pages(
    tenant_id: RequiredTenantId,
    db: DbSession,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[SitePageOut]]:
    """List site pages for the current tenant."""
    service = SitePageService(db)
    pages = await service.list_pages(tenant_id, status=status, limit=limit, offset=offset)
    return ApiResponse(success=True, data=[_page_to_out(p) for p in pages], error=None)


@router.get("/pages/{page_id}", response_model=ApiResponse[SitePageOut])
async def get_page(
    page_id: str,
    tenant_id: RequiredTenantId,
    db: DbSession,
) -> ApiResponse[SitePageOut]:
    """Get a site page by id."""
    service = SitePageService(db)
    page = await service.get_by_id(page_id, tenant_id)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )
    return ApiResponse(success=True, data=_page_to_out(page), error=None)


@router.post(
    "/pages",
    response_model=ApiResponse[SitePageOut],
    status_code=status.HTTP_201_CREATED,
)
async def create_page(
    tenant_id: RequiredTenantId,
    body: SitePageCreate,
    db: DbSession,
) -> ApiResponse[SitePageOut]:
    """Create a site page."""
    service = SitePageService(db)
    page = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_page_to_out(page), error=None)


@router.patch("/pages/{page_id}", response_model=ApiResponse[SitePageOut])
async def update_page(
    page_id: str,
    tenant_id: RequiredTenantId,
    body: SitePageUpdate,
    db: DbSession,
) -> ApiResponse[SitePageOut]:
    """Update a site page."""
    service = SitePageService(db)
    page = await service.update(page_id, tenant_id, body)
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )
    return ApiResponse(success=True, data=_page_to_out(page), error=None)


@router.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: str,
    tenant_id: RequiredTenantId,
    db: DbSession,
) -> None:
    """Delete a site page."""
    service = SitePageService(db)
    deleted = await service.delete(page_id, tenant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found",
        )
