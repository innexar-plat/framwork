"""Briefing service — CRUD for briefings (platform-level)."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Briefing
from app.repositories.briefing_repository import BriefingRepository
from app.schemas.briefing import BriefingCreate, BriefingUpdate


class BriefingService:
    """Business logic for briefings."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = BriefingRepository(db)

    async def get_by_id(self, briefing_id: str) -> Briefing | None:
        return await self._repo.get_by_id(briefing_id)

    async def list_all(
        self,
        status_filter: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Briefing]:
        return await self._repo.list_all(status_filter=status_filter, limit=limit, offset=offset)

    async def create(self, body: BriefingCreate) -> Briefing:
        briefing = Briefing(
            id=uuid4().hex,
            client_name=body.client_name,
            client_email=body.client_email,
            client_phone=body.client_phone,
            plan_code=body.plan_code,
            niche_code=body.niche_code,
            slug_requested=body.slug_requested,
            business_name=body.business_name,
            business_description=body.business_description,
            slogan=body.slogan,
            logo_url=body.logo_url,
            primary_color=body.primary_color,
            secondary_color=body.secondary_color,
            address=body.address,
            city=body.city,
            state=body.state,
            zip_code=body.zip_code,
            social_links=body.social_links,
            modules_requested=body.modules_requested,
            use_custom_domain=body.use_custom_domain,
            custom_domain_requested=body.custom_domain_requested,
            notes=body.notes,
        )
        return await self._repo.add(briefing)

    async def update(self, briefing_id: str, body: BriefingUpdate) -> Briefing | None:
        briefing = await self._repo.get_by_id(briefing_id)
        if not briefing:
            return None
        if body.status is not None:
            briefing.status = body.status
        if body.tenant_id is not None:
            briefing.tenant_id = body.tenant_id
        if body.provisioned_at is not None:
            briefing.provisioned_at = body.provisioned_at
        return await self._repo.update(briefing)

    async def delete(self, briefing_id: str) -> bool:
        briefing = await self._repo.get_by_id(briefing_id)
        if not briefing:
            return False
        await self._repo.delete(briefing)
        return True
