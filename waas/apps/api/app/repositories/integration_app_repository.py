"""IntegrationApp repository — API key lookup."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import IntegrationApp


class IntegrationAppRepository:
    """Data access for IntegrationApp (API keys)."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_public_key(self, public_key: str) -> IntegrationApp | None:
        result = await self._db.execute(
            select(IntegrationApp).where(
                IntegrationApp.public_key == public_key,
                IntegrationApp.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()
