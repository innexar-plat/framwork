"""TenantIntegration repository — get/list/set by tenant and code."""

import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TenantIntegration


class TenantIntegrationRepository:
    """Data access for TenantIntegration. All queries scoped by tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get(self, tenant_id: str, integration_code: str) -> TenantIntegration | None:
        result = await self._db.execute(
            select(TenantIntegration).where(
                TenantIntegration.tenant_id == tenant_id,
                TenantIntegration.integration_code == integration_code,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_tenant(self, tenant_id: str) -> list[TenantIntegration]:
        result = await self._db.execute(
            select(TenantIntegration)
            .where(TenantIntegration.tenant_id == tenant_id)
            .order_by(TenantIntegration.integration_code)
        )
        return list(result.scalars().all())

    async def add(self, ti: TenantIntegration) -> TenantIntegration:
        self._db.add(ti)
        await self._db.flush()
        await self._db.refresh(ti)
        return ti

    async def update(self, ti: TenantIntegration) -> TenantIntegration:
        await self._db.flush()
        await self._db.refresh(ti)
        return ti
