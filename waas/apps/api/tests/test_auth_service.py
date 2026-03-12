"""Tests for app.services.auth_service."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.security import hash_password
from app.schemas.auth import LoginRequest
from app.services.auth_service import AuthService


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def auth_service(mock_db: AsyncMock) -> AuthService:
    return AuthService(mock_db)


@pytest.mark.asyncio
async def test_login_invalid_email_returns_none(auth_service: AuthService) -> None:
    auth_service._user_repo.get_by_email = AsyncMock(return_value=None)
    result = await auth_service.login(LoginRequest(email="nobody@example.com", password="x"))
    assert result is None


@pytest.mark.asyncio
async def test_login_wrong_password_returns_none(auth_service: AuthService) -> None:
    user = MagicMock()
    user.id = "user-1"
    user.password_hash = hash_password("correct")
    user.user_tenants = []
    auth_service._user_repo.get_by_email = AsyncMock(return_value=user)
    result = await auth_service.login(LoginRequest(email="u@x.com", password="wrong"))
    assert result is None


@pytest.mark.asyncio
async def test_login_success_returns_tokens(auth_service: AuthService) -> None:
    user = MagicMock()
    user.id = "user-1"
    user.password_hash = hash_password("secret123")
    user.user_tenants = []
    auth_service._user_repo.get_by_email = AsyncMock(return_value=user)
    result = await auth_service.login(LoginRequest(email="u@x.com", password="secret123"))
    assert result is not None
    access, refresh, tenant_id, role = result
    assert len(access) > 0
    assert len(refresh) > 0
    assert tenant_id is None
    assert role is None


@pytest.mark.asyncio
async def test_login_success_with_tenant_returns_tenant_and_role(auth_service: AuthService) -> None:
    ut = MagicMock()
    ut.tenant_id = "tenant-1"
    ut.role = "admin"
    user = MagicMock()
    user.id = "user-1"
    user.password_hash = hash_password("secret123")
    user.user_tenants = [ut]
    auth_service._user_repo.get_by_email = AsyncMock(return_value=user)
    result = await auth_service.login(LoginRequest(email="u@x.com", password="secret123"))
    assert result is not None
    _, _, tenant_id, role = result
    assert tenant_id == "tenant-1"
    assert role == "admin"


@pytest.mark.asyncio
async def test_refresh_tokens_invalid_returns_none(auth_service: AuthService) -> None:
    result = await auth_service.refresh_tokens("invalid-token")
    assert result is None


@pytest.mark.asyncio
async def test_refresh_tokens_access_token_returns_none(auth_service: AuthService) -> None:
    from app.core.security import create_access_token

    access = create_access_token("user-1")
    result = await auth_service.refresh_tokens(access)
    assert result is None


@pytest.mark.asyncio
async def test_refresh_tokens_user_not_found_returns_none(auth_service: AuthService) -> None:
    from app.core.security import create_refresh_token

    refresh = create_refresh_token("user-1")
    auth_service._user_repo.get_by_id = AsyncMock(return_value=None)
    result = await auth_service.refresh_tokens(refresh)
    assert result is None


@pytest.mark.asyncio
async def test_refresh_tokens_success_returns_new_tokens(auth_service: AuthService) -> None:
    from app.core.security import create_refresh_token

    refresh = create_refresh_token("user-1")
    user = MagicMock()
    user.id = "user-1"
    auth_service._user_repo.get_by_id = AsyncMock(return_value=user)
    result = await auth_service.refresh_tokens(refresh)
    assert result is not None
    new_access, new_refresh = result
    assert len(new_access) > 0
    assert len(new_refresh) > 0
