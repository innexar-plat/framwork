"""Blog service — CRUD for blog posts scoped by tenant."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BlogPost
from app.repositories.blog_repository import BlogRepository
from app.schemas.blog import BlogPostCreate, BlogPostUpdate


class BlogService:
    """Business logic for blog posts. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = BlogRepository(db)

    async def list_posts(
        self,
        tenant_id: str,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[BlogPost]:
        return await self._repo.list_by_tenant(tenant_id, status=status, limit=limit, offset=offset)

    async def get_by_id(self, post_id: str, tenant_id: str) -> BlogPost | None:
        return await self._repo.get_by_id(post_id, tenant_id)

    async def get_by_slug(self, slug: str, tenant_id: str) -> BlogPost | None:
        return await self._repo.get_by_slug(slug, tenant_id)

    async def create(self, tenant_id: str, body: BlogPostCreate) -> BlogPost:
        post = BlogPost(
            id=uuid4().hex,
            tenant_id=tenant_id,
            title=body.title,
            slug=body.slug,
            content=body.content,
            status=body.status,
            meta_title=body.meta_title,
            meta_description=body.meta_description,
        )
        return await self._repo.add(post)

    async def update(self, post_id: str, tenant_id: str, body: BlogPostUpdate) -> BlogPost | None:
        post = await self._repo.get_by_id(post_id, tenant_id)
        if not post:
            return None
        if body.title is not None:
            post.title = body.title
        if body.slug is not None:
            post.slug = body.slug
        if body.content is not None:
            post.content = body.content
        if body.status is not None:
            post.status = body.status
        if body.meta_title is not None:
            post.meta_title = body.meta_title
        if body.meta_description is not None:
            post.meta_description = body.meta_description
        return await self._repo.update(post)

    async def delete(self, post_id: str, tenant_id: str) -> bool:
        post = await self._repo.get_by_id(post_id, tenant_id)
        if not post:
            return False
        await self._repo.delete(post)
        return True
