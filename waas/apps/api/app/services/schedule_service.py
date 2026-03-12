"""Schedule service — CRUD for schedule items scoped by tenant."""

from datetime import datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ScheduleItem
from app.repositories.schedule_repository import ScheduleRepository
from app.schemas.schedule import ScheduleItemCreate, ScheduleItemUpdate


class ScheduleService:
    """Business logic for schedule items. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = ScheduleRepository(db)

    async def list_items(
        self,
        tenant_id: str,
        start_from: datetime | None = None,
        end_before: datetime | None = None,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ScheduleItem]:
        return await self._repo.list_by_tenant(
            tenant_id,
            start_from=start_from,
            end_before=end_before,
            status=status,
            limit=limit,
            offset=offset,
        )

    async def get_by_id(self, item_id: str, tenant_id: str) -> ScheduleItem | None:
        return await self._repo.get_by_id(item_id, tenant_id)

    async def create(self, tenant_id: str, body: ScheduleItemCreate) -> ScheduleItem:
        item = ScheduleItem(
            id=uuid4().hex,
            tenant_id=tenant_id,
            title=body.title,
            start_at=body.start_at,
            end_at=body.end_at,
            status=body.status,
            contact_name=body.contact_name,
            contact_email=body.contact_email,
            notes=body.notes,
        )
        return await self._repo.add(item)

    async def update(
        self,
        item_id: str,
        tenant_id: str,
        body: ScheduleItemUpdate,
    ) -> ScheduleItem | None:
        item = await self._repo.get_by_id(item_id, tenant_id)
        if not item:
            return None
        if body.title is not None:
            item.title = body.title
        if body.start_at is not None:
            item.start_at = body.start_at
        if body.end_at is not None:
            item.end_at = body.end_at
        if body.status is not None:
            item.status = body.status
        if body.contact_name is not None:
            item.contact_name = body.contact_name
        if body.contact_email is not None:
            item.contact_email = body.contact_email
        if body.notes is not None:
            item.notes = body.notes
        return await self._repo.update(item)

    async def delete(self, item_id: str, tenant_id: str) -> bool:
        item = await self._repo.get_by_id(item_id, tenant_id)
        if not item:
            return False
        await self._repo.delete(item)
        return True
