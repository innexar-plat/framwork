"""Auth service: login, tokens."""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.repositories.user_repository import UserRepository
from app.repositories.user_tenant_repository import UserTenantRepository
from app.schemas.auth import LoginRequest

logger = logging.getLogger(__name__)


class AuthService:
    """Login and token handling."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._user_repo = UserRepository(db)
        self._user_tenant_repo = UserTenantRepository(db)

    async def login(self, body: LoginRequest) -> tuple[str, str, str | None, str | None] | None:
        """Returns (access_token, refresh_token, tenant_id, role) or None if invalid."""
        user = await self._user_repo.get_by_email(body.email)
        if not user or not verify_password(body.password, user.password_hash):
            return None
        tenant_id: str | None = None
        role: str | None = None
        ut_list = [ut for ut in user.user_tenants]
        if ut_list:
            tenant_id = ut_list[0].tenant_id
            role = ut_list[0].role
        access = create_access_token(str(user.id), tenant_id=tenant_id, role=role)
        refresh = create_refresh_token(str(user.id))
        return (access, refresh, tenant_id, role)

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str] | None:
        """Returns (access_token, refresh_token) or None. Preserves tenant/role in new access token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None
        sub = payload.get("sub")
        if not sub:
            return None
        user = await self._user_repo.get_by_id(sub)
        if not user:
            return None
        tenant_id: str | None = None
        role: str | None = None
        ut_list = [ut for ut in user.user_tenants]
        if ut_list:
            tenant_id = ut_list[0].tenant_id
            role = ut_list[0].role
        access = create_access_token(str(user.id), tenant_id=tenant_id, role=role)
        return (access, create_refresh_token(str(user.id)))
