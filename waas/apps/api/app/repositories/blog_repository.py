"""Blog post repository — all queries scoped by tenant_id."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import BlogPost


class BlogRepository:
    """Data access for BlogPost. Always filter by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, post_id: str, tenant_id: str) -> BlogPost | None:
        result = await self._db.execute(
            select(BlogPost).where(
                BlogPost.id == post_id,
                BlogPost.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def get_by_slug(self, slug: str, tenant_id: str) -> BlogPost | None:
        result = await self._db.execute(
            select(BlogPost).where(
                BlogPost.slug == slug,
                BlogPost.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def list_by_tenant(
        self,
        tenant_id: str,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[BlogPost]:
        q = select(BlogPost).where(BlogPost.tenant_id == tenant_id)
        if status:
            q = q.where(BlogPost.status == status)
        q = q.order_by(BlogPost.created_at.desc()).limit(limit).offset(offset)
        result = await self._db.execute(q)
        return list(result.scalars().all())

    async def add(self, post: BlogPost) -> BlogPost:
        self._db.add(post)
        await self._db.flush()
        await self._db.refresh(post)
        return post

    async def update(self, post: BlogPost) -> BlogPost:
        await self._db.flush()
        await self._db.refresh(post)
        return post

    async def delete(self, post: BlogPost) -> None:
        await self._db.delete(post)
        await self._db.flush()
