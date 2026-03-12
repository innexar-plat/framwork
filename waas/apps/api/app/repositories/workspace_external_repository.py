"""WorkspaceExternal repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import WorkspaceExternal


class WorkspaceExternalRepository:
    """Data access for WorkspaceExternal."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_external_id_and_source(
        self, external_workspace_id: str, source: str = "billing_v1"
    ) -> WorkspaceExternal | None:
        result = await self._db.execute(
            select(WorkspaceExternal).where(
                WorkspaceExternal.external_workspace_id == external_workspace_id,
                WorkspaceExternal.source == source,
            )
        )
        return result.scalar_one_or_none()

    async def add(self, workspace_external: WorkspaceExternal) -> WorkspaceExternal:
        self._db.add(workspace_external)
        await self._db.flush()
        await self._db.refresh(workspace_external)
        return workspace_external
