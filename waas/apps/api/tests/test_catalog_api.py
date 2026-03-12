"""Tests for catalog API (plans, niches, modules)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_list_plans_returns_200(client: TestClient) -> None:
    from app.core.database import get_db

    plan = MagicMock()
    plan.id = "p1"
    plan.code = "starter"
    plan.name = "Starter"
    plan.description = "Starter plan"
    plan.sort_order = 1
    plan.is_active = True

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.catalog.CatalogService") as mock_catalog:
        mock_catalog.return_value.list_plans = AsyncMock(return_value=[plan])
        response = client.get("/api/v1/catalog/plans")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["code"] == "starter"


def test_list_niches_returns_200(client: TestClient) -> None:
    from app.core.database import get_db

    niche = MagicMock()
    niche.id = "n1"
    niche.code = "house_cleaning"
    niche.name = "House Cleaning"
    niche.parent_id = None
    niche.sort_order = 1
    niche.is_active = True

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.catalog.CatalogService") as mock_catalog:
        mock_catalog.return_value.list_niches = AsyncMock(return_value=[niche])
        response = client.get("/api/v1/catalog/niches")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"][0]["code"] == "house_cleaning"


def test_list_modules_returns_200(client: TestClient) -> None:
    from app.core.database import get_db

    module = MagicMock()
    module.id = "m1"
    module.code = "blog"
    module.name = "Blog"
    module.description = "Blog"
    module.is_active = True

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.v1.catalog.CatalogService") as mock_catalog:
        mock_catalog.return_value.list_modules = AsyncMock(return_value=[module])
        response = client.get("/api/v1/catalog/modules")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["data"][0]["code"] == "blog"
