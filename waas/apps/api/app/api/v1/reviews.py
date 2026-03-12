"""Reviews API — CRUD and reorder. Requires reviews module active for tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.repositories.review_repository import ReviewRepository
from app.schemas.common import ApiResponse
from app.schemas.review_item import (
    ReviewCreate,
    ReviewReorder,
    ReviewResponse,
    ReviewUpdate,
)

router = APIRouter()

TenantIdReviews = Annotated[str, Depends(require_active_module("reviews"))]


def _to_response(item) -> ReviewResponse:
    return ReviewResponse(
        id=item.id,
        tenant_id=item.tenant_id,
        author_name=item.author_name,
        author_photo=item.author_photo,
        rating=item.rating,
        text=item.text,
        source=item.source,
        google_review_id=item.google_review_id,
        is_published=item.is_published,
        sort_order=item.sort_order,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=ApiResponse[list[ReviewResponse]])
async def list_reviews(
    db: DbSession,
    tenant_id: TenantIdReviews,
    published: bool | None = None,
    limit: int = 100,
    offset: int = 0,
) -> ApiResponse[list[ReviewResponse]]:
    """List reviews. Use ?published=true for published only, ?published=false for drafts."""
    repo = ReviewRepository(db)
    published_only = published is True
    draft_only = published is False
    items = await repo.list_by_tenant(
        tenant_id,
        published_only=published_only,
        draft_only=draft_only,
        limit=limit,
        offset=offset,
    )
    return ApiResponse(success=True, data=[_to_response(i) for i in items], error=None)


@router.post("", response_model=ApiResponse[ReviewResponse], status_code=status.HTTP_201_CREATED)
async def create_review(
    body: ReviewCreate,
    db: DbSession,
    tenant_id: TenantIdReviews,
) -> ApiResponse[ReviewResponse]:
    """Create a review."""
    repo = ReviewRepository(db)
    data = body.model_dump()
    item = await repo.create(tenant_id, data)
    return ApiResponse(success=True, data=_to_response(item), error=None)


@router.post("/reorder", response_model=ApiResponse[None])
async def reorder_reviews(
    body: ReviewReorder,
    db: DbSession,
    tenant_id: TenantIdReviews,
) -> ApiResponse[None]:
    """Reorder reviews by id list."""
    repo = ReviewRepository(db)
    await repo.reorder(tenant_id, body.ids)
    return ApiResponse(success=True, data=None, error=None)


@router.get("/{review_id}", response_model=ApiResponse[ReviewResponse])
async def get_review(
    review_id: str,
    db: DbSession,
    tenant_id: TenantIdReviews,
) -> ApiResponse[ReviewResponse]:
    """Get a review by id."""
    repo = ReviewRepository(db)
    item = await repo.get_by_id(review_id, tenant_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return ApiResponse(success=True, data=_to_response(item), error=None)


@router.patch("/{review_id}", response_model=ApiResponse[ReviewResponse])
async def update_review(
    review_id: str,
    body: ReviewUpdate,
    db: DbSession,
    tenant_id: TenantIdReviews,
) -> ApiResponse[ReviewResponse]:
    """Update a review (toggle published, edit fields)."""
    repo = ReviewRepository(db)
    item = await repo.get_by_id(review_id, tenant_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    data = body.model_dump(exclude_unset=True)
    item = await repo.update(item, data)
    return ApiResponse(success=True, data=_to_response(item), error=None)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: str,
    db: DbSession,
    tenant_id: TenantIdReviews,
) -> None:
    """Delete a review."""
    repo = ReviewRepository(db)
    item = await repo.get_by_id(review_id, tenant_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    await repo.delete(item)
