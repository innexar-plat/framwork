"""Tests for catalog admin API (require catalog_admin role)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_list_plans_admin_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/admin/catalog/plans")
    assert response.status_code == 401


def test_list_plans_admin_returns_403_without_role(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.core.deps.decode_token") as mock_decode:
        mock_decode.return_value = {"sub": "u1", "type": "access"}
        with patch("app.core.catalog_admin.UserRepository") as mock_repo_cls:
            mock_repo = MagicMock()
            user = MagicMock()
            user.global_role = None
            mock_repo.get_by_id = AsyncMock(return_value=user)
            mock_repo_cls.return_value = mock_repo
            response = client.get(
                "/api/v1/admin/catalog/plans",
                headers={"Authorization": "Bearer fake-token"},
            )
    app.dependency_overrides.clear()
    assert response.status_code == 403


def test_list_plans_admin_success_with_role(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.core.deps.decode_token") as mock_decode:
        mock_decode.return_value = {"sub": "u1", "type": "access"}
        with patch("app.core.catalog_admin.UserRepository") as mock_repo_cls:
            mock_repo = MagicMock()
            user = MagicMock()
            user.global_role = "catalog_admin"
            mock_repo.get_by_id = AsyncMock(return_value=user)
            mock_repo_cls.return_value = mock_repo
            with patch("app.api.v1.catalog_admin.CatalogAdminService") as mock_svc:
                mock_svc.return_value.list_plans_all = AsyncMock(return_value=[])
                response = client.get(
                    "/api/v1/admin/catalog/plans",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == []
