"""Lead service — create and list leads scoped by tenant."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Lead
from app.repositories.lead_repository import LeadRepository
from app.schemas.lead import LeadCreate


class LeadService:
    """Business logic for leads. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = LeadRepository(db)

    async def list_leads(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Lead]:
        return await self._repo.list_by_tenant(tenant_id, limit=limit, offset=offset)

    async def get_by_id(self, lead_id: str, tenant_id: str) -> Lead | None:
        return await self._repo.get_by_id(lead_id, tenant_id)

    async def create(self, tenant_id: str, body: LeadCreate) -> Lead:
        lead = Lead(
            id=uuid4().hex,
            tenant_id=tenant_id,
            name=body.name,
            email=body.email,
            source=body.source,
            message=body.message,
        )
        return await self._repo.add(lead)
