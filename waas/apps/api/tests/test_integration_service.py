"""Tests for app.services.integration_service."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models import Tenant, WorkspaceExternal
from app.schemas.integration import CreateWorkspaceRequest, UpdateWorkspaceRequest
from app.services.integration_service import IntegrationService


@pytest.fixture
def mock_db() -> MagicMock:
    db = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    return db


@pytest.fixture
def integration_service(mock_db: MagicMock) -> IntegrationService:
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


@pytest.mark.asyncio
async def test_create_workspace_creates_dns_record_for_new_tenant(
    integration_service: IntegrationService,
) -> None:
    integration_service._workspace_repo.get_by_external_id_and_source = AsyncMock(return_value=None)
    integration_service._tenant_repo.slug_or_subdomain_taken = AsyncMock(return_value=False)
    integration_service._catalog.get_plan_id_by_code = AsyncMock(return_value="plan-1")
    integration_service._catalog.get_niche_id_by_code = AsyncMock(return_value="niche-1")
    integration_service._tenant_repo.add = AsyncMock(side_effect=lambda tenant: tenant)
    integration_service._workspace_repo.add = AsyncMock()
    integration_service._cf.create_subdomain = AsyncMock(return_value="cf-123")

    body = CreateWorkspaceRequest(
        name="Tenant ACME",
        slug="tenant-acme",
        external_workspace_id="ext-acme",
    )

    tenant, _, _ = await integration_service.create_workspace(body)

    assert tenant.slug == "tenant-acme"
    assert tenant.subdomain == "tenant-acme"
    assert tenant.cf_record_id == "cf-123"
    integration_service._cf.create_subdomain.assert_awaited_once_with("tenant-acme")


@pytest.mark.asyncio
async def test_set_tenant_status_suspended_removes_dns(
    integration_service: IntegrationService,
) -> None:
    tenant = MagicMock(spec=Tenant)
    tenant.status = "active"
    tenant.slug = "tenant-acme"
    tenant.subdomain = "tenant-acme"
    tenant.cf_record_id = "cf-123"
    we = MagicMock(spec=WorkspaceExternal)

    integration_service.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
    integration_service._cf.delete_subdomain = AsyncMock(return_value=True)

    result = await integration_service.set_tenant_status("ext-acme", "suspended")

    assert result is tenant
    assert tenant.status == "suspended"
    assert tenant.cf_record_id is None
    integration_service._cf.delete_subdomain.assert_awaited_once_with("cf-123")


@pytest.mark.asyncio
async def test_set_tenant_status_active_creates_dns_when_missing(
    integration_service: IntegrationService,
) -> None:
    tenant = MagicMock(spec=Tenant)
    tenant.status = "suspended"
    tenant.slug = "tenant-acme"
    tenant.subdomain = "tenant-acme"
    tenant.cf_record_id = None
    we = MagicMock(spec=WorkspaceExternal)

    integration_service.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
    integration_service._cf.create_subdomain = AsyncMock(return_value="cf-789")

    result = await integration_service.set_tenant_status("ext-acme", "active")

    assert result is tenant
    assert tenant.status == "active"
    assert tenant.cf_record_id == "cf-789"
    integration_service._cf.create_subdomain.assert_awaited_once_with("tenant-acme")
