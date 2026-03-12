"""Tenant members service — list, invite, update role, remove."""

from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UserTenant
from app.repositories.user_repository import UserRepository
from app.repositories.user_tenant_repository import UserTenantRepository


class TenantUserService:
    """Business logic for tenant members. Requires tenant_id from JWT."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._ut_repo = UserTenantRepository(db)
        self._user_repo = UserRepository(db)

    async def list_members(self, tenant_id: str) -> list[UserTenant]:
        """List all user_tenants for the tenant (with user loaded)."""
        return await self._ut_repo.list_by_tenant(tenant_id)

    async def get_member(self, user_tenant_id: str, tenant_id: str) -> UserTenant | None:
        return await self._ut_repo.get_by_id(user_tenant_id, tenant_id)

    async def invite_by_email(
        self, tenant_id: str, email: str, role: str
    ) -> tuple[UserTenant | None, str | None]:
        """
        Add existing user to tenant by email. Returns (user_tenant, error_message).
        Error if user not found or already member.
        """
        user = await self._user_repo.get_by_email(email)
        if not user:
            return None, "User not found"
        existing = await self._ut_repo.get_by_user_and_tenant(str(user.id), tenant_id)
        if existing:
            return None, "User is already a member"
        ut = UserTenant(
            id=uuid4().hex,
            user_id=user.id,
            tenant_id=tenant_id,
            role=role or "member",
        )
        await self._ut_repo.add(ut)
        loaded = await self._ut_repo.get_by_id(ut.id, tenant_id)
        return loaded, None

    async def update_role(
        self, user_tenant_id: str, tenant_id: str, role: str
    ) -> UserTenant | None:
        ut = await self._ut_repo.get_by_id(user_tenant_id, tenant_id)
        if not ut:
            return None
        return await self._ut_repo.update_role(ut, role)

    async def remove_member(self, user_tenant_id: str, tenant_id: str) -> bool:
        ut = await self._ut_repo.get_by_id(user_tenant_id, tenant_id)
        if not ut:
            return False
        await self._ut_repo.delete(ut)
        return True
