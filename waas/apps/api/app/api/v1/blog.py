"""Blog API — CRUD for blog posts. Requires blog module active for tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.schemas.blog import BlogPostCreate, BlogPostOut, BlogPostUpdate
from app.schemas.common import ApiResponse
from app.services.blog_service import BlogService

router = APIRouter()

TenantIdBlog = Annotated[str, Depends(require_active_module("blog"))]


def _post_to_out(post) -> BlogPostOut:
    return BlogPostOut(
        id=post.id,
        tenant_id=post.tenant_id,
        title=post.title,
        slug=post.slug,
        content=post.content,
        status=post.status,
        meta_title=getattr(post, "meta_title", None),
        meta_description=getattr(post, "meta_description", None),
    )


@router.get("/posts", response_model=ApiResponse[list[BlogPostOut]])
async def list_posts(
    db: DbSession,
    tenant_id: TenantIdBlog,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[BlogPostOut]]:
    """List blog posts for the current tenant."""
    service = BlogService(db)
    posts = await service.list_posts(tenant_id, status=status, limit=limit, offset=offset)
    return ApiResponse(success=True, data=[_post_to_out(p) for p in posts], error=None)


@router.get("/posts/{post_id}", response_model=ApiResponse[BlogPostOut])
async def get_post(
    post_id: str,
    db: DbSession,
    tenant_id: TenantIdBlog,
) -> ApiResponse[BlogPostOut]:
    """Get a blog post by id."""
    service = BlogService(db)
    post = await service.get_by_id(post_id, tenant_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return ApiResponse(success=True, data=_post_to_out(post), error=None)


@router.post("/posts", response_model=ApiResponse[BlogPostOut], status_code=status.HTTP_201_CREATED)
async def create_post(
    body: BlogPostCreate,
    db: DbSession,
    tenant_id: TenantIdBlog,
) -> ApiResponse[BlogPostOut]:
    """Create a blog post."""
    service = BlogService(db)
    post = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_post_to_out(post), error=None)


@router.patch("/posts/{post_id}", response_model=ApiResponse[BlogPostOut])
async def update_post(
    post_id: str,
    body: BlogPostUpdate,
    db: DbSession,
    tenant_id: TenantIdBlog,
) -> ApiResponse[BlogPostOut]:
    """Update a blog post."""
    service = BlogService(db)
    post = await service.update(post_id, tenant_id, body)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return ApiResponse(success=True, data=_post_to_out(post), error=None)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    db: DbSession,
    tenant_id: TenantIdBlog,
) -> None:
    """Delete a blog post."""
    service = BlogService(db)
    deleted = await service.delete(post_id, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
