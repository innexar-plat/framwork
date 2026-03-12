"""Tests for property API (module guard + list/create/delete)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_list_property_items_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/property/items")
    assert response.status_code == 401


def test_list_property_items_returns_403_when_module_not_enabled(
    client: TestClient,
) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.core.deps.decode_token") as mock_decode:
        mock_decode.return_value = {
            "sub": "u1",
            "type": "access",
            "tenant_id": "tid-1",
        }
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=[])
            mock_catalog_cls.return_value = mock_catalog
            response = client.get(
                "/api/v1/property/items",
                headers={"Authorization": "Bearer fake-token"},
            )
    app.dependency_overrides.clear()
    assert response.status_code == 403


def test_list_property_items_success_with_mocks(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.property.PropertyService") as mock_svc_cls:
        mock_svc = MagicMock()
        mock_svc.list_items = AsyncMock(return_value=[])
        mock_svc_cls.return_value = mock_svc
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["property"])
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.get(
                    "/api/v1/property/items",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == []


def test_create_property_item_success_with_mocks(client: TestClient) -> None:
    from app.core.database import get_db
    from app.models import PropertyItem

    async def override_get_db():
        yield MagicMock()

    fake_item = PropertyItem(
        id="prop1",
        tenant_id="tid-1",
        title="Casa A",
        address="Rua X",
        status="draft",
    )
    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.property.PropertyService") as mock_svc_cls:
        mock_svc = MagicMock()
        mock_svc.create = AsyncMock(return_value=fake_item)
        mock_svc_cls.return_value = mock_svc
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["property"])
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.post(
                    "/api/v1/property/items",
                    headers={"Authorization": "Bearer fake-token"},
                    json={"title": "Casa A", "address": "Rua X"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["id"] == "prop1"
    assert data["title"] == "Casa A"
    assert data["address"] == "Rua X"
    assert data["status"] == "draft"


def test_delete_property_item_404(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.property.PropertyService") as mock_svc_cls:
        mock_svc = MagicMock()
        mock_svc.delete = AsyncMock(return_value=False)
        mock_svc_cls.return_value = mock_svc
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["property"])
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.delete(
                    "/api/v1/property/items/nonexistent",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 404


def test_delete_property_item_success(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.property.PropertyService") as mock_svc_cls:
        mock_svc = MagicMock()
        mock_svc.delete = AsyncMock(return_value=True)
        mock_svc_cls.return_value = mock_svc
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["property"])
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.delete(
                    "/api/v1/property/items/prop1",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 204
