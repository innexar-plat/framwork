"""Tests for app.api.v1.integration endpoints (provisionamento)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_create_workspace_requires_api_key_returns_401(client: TestClient) -> None:
    response = client.post(
        "/api/v1/integration/workspaces",
        json={
            "name": "Test",
            "slug": "test",
            "external_workspace_id": "ext-1",
        },
    )
    assert response.status_code == 401


def test_get_workspace_without_api_key_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/integration/workspaces/ext-1")
    assert response.status_code == 401


def test_patch_workspace_without_api_key_returns_401(client: TestClient) -> None:
    response = client.patch(
        "/api/v1/integration/workspaces/ext-1",
        json={"plan_code": "pro"},
    )
    assert response.status_code == 401


def test_suspend_without_api_key_returns_401(client: TestClient) -> None:
    response = client.post("/api/v1/integration/workspaces/ext-1/suspend")
    assert response.status_code == 401


def test_reactivate_without_api_key_returns_401(client: TestClient) -> None:
    response = client.post("/api/v1/integration/workspaces/ext-1/reactivate")
    assert response.status_code == 401


def test_create_workspace_success_returns_200(client: TestClient) -> None:
    """Integration create_workspace success path (mocked service and auth)."""
    from app.core.api_key_auth import get_integration_app
    from app.core.database import get_db

    tenant = MagicMock()
    tenant.id = "tid-1"
    tenant.slug = "my-workspace"
    tenant.name = "My Workspace"
    tenant.status = "active"
    tenant.plan_id = "pro"
    tenant.niche_id = "cleaning"
    we = MagicMock()
    we.external_workspace_id = "ext-1"

    async def override_get_db():
        yield MagicMock()

    async def override_get_integration_app():
        return MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_integration_app] = override_get_integration_app
    with patch("app.api.v1.integration.IntegrationService") as mock_svc:
        mock_svc.return_value.create_workspace = AsyncMock(return_value=(tenant, we, None))
        mock_svc.return_value.get_workspace_display = AsyncMock(
            return_value=("pro", "cleaning", ["blog", "leads"])
        )
        response = client.post(
            "/api/v1/integration/workspaces",
            json={
                "name": "My Workspace",
                "slug": "my-workspace",
                "external_workspace_id": "ext-1",
            },
            headers={"X-Api-Key": "pk", "X-Api-Secret": "sk"},
        )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["tenant_id"] == "tid-1"
    assert data["data"]["slug"] == "my-workspace"


def test_get_workspace_success_returns_200(client: TestClient) -> None:
    from app.core.api_key_auth import get_integration_app
    from app.core.database import get_db

    tenant = MagicMock()
    tenant.id = "tid-1"
    tenant.slug = "ws"
    tenant.name = "WS"
    tenant.status = "active"
    tenant.plan_id = None
    tenant.niche_id = None
    we = MagicMock()
    we.external_workspace_id = "ext-1"

    async def override_get_db():
        yield MagicMock()

    async def override_get_integration_app():
        return MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_integration_app] = override_get_integration_app
    with patch("app.api.v1.integration.IntegrationService") as mock_svc:
        mock_svc.return_value.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
        mock_svc.return_value.get_workspace_display = AsyncMock(return_value=(None, None, []))
        response = client.get(
            "/api/v1/integration/workspaces/ext-1",
            headers={"X-Api-Key": "pk", "X-Api-Secret": "sk"},
        )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["tenant_id"] == "tid-1"


def test_suspend_success_returns_200(client: TestClient) -> None:
    from app.core.api_key_auth import get_integration_app
    from app.core.database import get_db

    tenant = MagicMock()
    tenant.id = "tid-1"
    tenant.slug = "ws"
    tenant.name = "WS"
    tenant.status = "suspended"
    tenant.plan_id = None
    tenant.niche_id = None
    we = MagicMock()
    we.external_workspace_id = "ext-1"

    async def override_get_db():
        yield MagicMock()

    async def override_get_integration_app():
        return MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_integration_app] = override_get_integration_app
    with patch("app.api.v1.integration.IntegrationService") as mock_svc:
        mock_svc.return_value.set_tenant_status = AsyncMock(return_value=tenant)
        mock_svc.return_value.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
        mock_svc.return_value.get_workspace_display = AsyncMock(return_value=(None, None, ["blog"]))
        response = client.post(
            "/api/v1/integration/workspaces/ext-1/suspend",
            headers={"X-Api-Key": "pk", "X-Api-Secret": "sk"},
        )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "suspended"


def test_update_workspace_success_returns_200(client: TestClient) -> None:
    from app.core.api_key_auth import get_integration_app
    from app.core.database import get_db

    tenant = MagicMock()
    tenant.id = "tid-1"
    tenant.slug = "ws"
    tenant.name = "WS"
    tenant.status = "active"
    tenant.plan_id = "pro"
    tenant.niche_id = "cleaning"
    we = MagicMock()
    we.external_workspace_id = "ext-1"

    async def override_get_db():
        yield MagicMock()

    async def override_get_integration_app():
        return MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_integration_app] = override_get_integration_app
    with patch("app.api.v1.integration.IntegrationService") as mock_svc:
        mock_svc.return_value.update_workspace = AsyncMock(return_value=tenant)
        mock_svc.return_value.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
        mock_svc.return_value.get_workspace_display = AsyncMock(
            return_value=("pro", "cleaning", ["blog", "leads"])
        )
        response = client.patch(
            "/api/v1/integration/workspaces/ext-1",
            json={"plan_code": "pro", "niche_code": "cleaning"},
            headers={"X-Api-Key": "pk", "X-Api-Secret": "sk"},
        )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["plan_code"] == "pro"


def test_reactivate_success_returns_200(client: TestClient) -> None:
    from app.core.api_key_auth import get_integration_app
    from app.core.database import get_db

    tenant = MagicMock()
    tenant.id = "tid-1"
    tenant.slug = "ws"
    tenant.name = "WS"
    tenant.status = "active"
    tenant.plan_id = None
    tenant.niche_id = None
    we = MagicMock()
    we.external_workspace_id = "ext-1"

    async def override_get_db():
        yield MagicMock()

    async def override_get_integration_app():
        return MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_integration_app] = override_get_integration_app
    with patch("app.api.v1.integration.IntegrationService") as mock_svc:
        mock_svc.return_value.set_tenant_status = AsyncMock(return_value=tenant)
        mock_svc.return_value.get_workspace_by_external_id = AsyncMock(return_value=(tenant, we))
        mock_svc.return_value.get_workspace_display = AsyncMock(return_value=(None, None, []))
        response = client.post(
            "/api/v1/integration/workspaces/ext-1/reactivate",
            headers={"X-Api-Key": "pk", "X-Api-Secret": "sk"},
        )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "active"
