"""Property service — create and list property items scoped by tenant."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PropertyItem
from app.repositories.property_repository import PropertyRepository
from app.schemas.property import PropertyItemCreate


class PropertyService:
    """Business logic for property items. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = PropertyRepository(db)

    async def list_items(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[PropertyItem]:
        return await self._repo.list_by_tenant(tenant_id, limit=limit, offset=offset)

    async def get_by_id(self, item_id: str, tenant_id: str) -> PropertyItem | None:
        return await self._repo.get_by_id(item_id, tenant_id)

    async def create(self, tenant_id: str, body: PropertyItemCreate) -> PropertyItem:
        item = PropertyItem(
            id=uuid4().hex,
            tenant_id=tenant_id,
            title=body.title,
            address=body.address,
            status=body.status,
        )
        return await self._repo.add(item)

    async def delete(self, item_id: str, tenant_id: str) -> bool:
        item = await self._repo.get_by_id(item_id, tenant_id)
        if not item:
            return False
        await self._repo.delete(item)
        return True
