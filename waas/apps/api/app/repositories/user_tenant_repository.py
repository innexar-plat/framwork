"""UserTenant repository."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import UserTenant


class UserTenantRepository:
    """Data access for UserTenant."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def add(self, user_tenant: UserTenant) -> UserTenant:
        self._db.add(user_tenant)
        await self._db.flush()
        await self._db.refresh(user_tenant)
        return user_tenant

    async def get_by_user_and_tenant(self, user_id: str, tenant_id: str) -> UserTenant | None:
        result = await self._db.execute(
            select(UserTenant).where(
                UserTenant.user_id == user_id,
                UserTenant.tenant_id == tenant_id,
            )
        )
        return result.scalars().first()

    async def get_by_id(self, user_tenant_id: str, tenant_id: str) -> UserTenant | None:
        result = await self._db.execute(
            select(UserTenant)
            .where(
                UserTenant.id == user_tenant_id,
                UserTenant.tenant_id == tenant_id,
            )
            .options(selectinload(UserTenant.user))
        )
        return result.scalars().first()

    async def list_by_tenant(self, tenant_id: str) -> list[UserTenant]:
        result = await self._db.execute(
            select(UserTenant)
            .where(UserTenant.tenant_id == tenant_id)
            .options(selectinload(UserTenant.user))
            .order_by(UserTenant.created_at.asc())
        )
        return list(result.scalars().all())

    async def update_role(self, user_tenant: UserTenant, role: str) -> UserTenant:
        user_tenant.role = role
        self._db.add(user_tenant)
        await self._db.flush()
        await self._db.refresh(user_tenant)
        return user_tenant

    async def delete(self, user_tenant: UserTenant) -> None:
        await self._db.delete(user_tenant)
        await self._db.flush()
