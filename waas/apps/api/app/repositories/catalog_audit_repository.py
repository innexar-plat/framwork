"""Catalog audit log repository."""

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import CatalogAuditLog


class CatalogAuditRepository:
    """Append-only audit log for catalog admin actions."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_recent(self, limit: int = 50) -> list[CatalogAuditLog]:
        result = await self._db.execute(
            select(CatalogAuditLog).order_by(CatalogAuditLog.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def log(
        self,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        details: str | None = None,
    ) -> CatalogAuditLog:
        row = CatalogAuditLog(
            id=uuid4().hex,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        self._db.add(row)
        await self._db.flush()
        await self._db.refresh(row)
        return row
