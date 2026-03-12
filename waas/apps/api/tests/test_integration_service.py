"""Tests for app.services.integration_service."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models import Tenant, WorkspaceExternal
from app.schemas.integration import UpdateWorkspaceRequest
from app.services.integration_service import IntegrationService


@pytest.fixture
def mock_db() -> AsyncMock:
    return AsyncMock()


@pytest.fixture
def integration_service(mock_db: AsyncMock) -> IntegrationService:
    return IntegrationService(mock_db)


@pytest.mark.asyncio
async def test_get_workspace_by_external_id_not_found(
    integration_service: IntegrationService,
) -> None:
    integration_service._workspace_repo.get_by_external_id_and_source = AsyncMock(return_value=None)
    result = await integration_service.get_workspace_by_external_id("ext-999")
    assert result is None


@pytest.mark.asyncio
async def test_get_workspace_by_external_id_tenant_not_found(
    integration_service: IntegrationService,
) -> None:
    we = MagicMock(spec=WorkspaceExternal)
    we.tenant_id = "tenant-1"
    integration_service._workspace_repo.get_by_external_id_and_source = AsyncMock(return_value=we)
    integration_service._tenant_repo.get_by_id = AsyncMock(return_value=None)
    result = await integration_service.get_workspace_by_external_id("ext-1")
    assert result is None


@pytest.mark.asyncio
async def test_get_workspace_by_external_id_success(
    integration_service: IntegrationService,
) -> None:
    we = MagicMock(spec=WorkspaceExternal)
    we.tenant_id = "tenant-1"
    tenant = MagicMock(spec=Tenant)
    tenant.id = "tenant-1"
    integration_service._workspace_repo.get_by_external_id_and_source = AsyncMock(return_value=we)
    integration_service._tenant_repo.get_by_id = AsyncMock(return_value=tenant)
    result = await integration_service.get_workspace_by_external_id("ext-1")
    assert result is not None
    t, w = result
    assert t.id == "tenant-1"
    assert w.tenant_id == "tenant-1"


@pytest.mark.asyncio
async def test_update_workspace_not_found_returns_none(
    integration_service: IntegrationService,
) -> None:
    integration_service.get_workspace_by_external_id = AsyncMock(return_value=None)
    result = await integration_service.update_workspace(
        "ext-999", UpdateWorkspaceRequest(plan_code="pro")
    )
    assert result is None


@pytest.mark.asyncio
async def test_set_tenant_status_not_found_returns_none(
    integration_service: IntegrationService,
) -> None:
    integration_service.get_workspace_by_external_id = AsyncMock(return_value=None)
    result = await integration_service.set_tenant_status("ext-999", "suspended")
    assert result is None
