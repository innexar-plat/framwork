"""Tests for payments API (stripe_payments module: list products)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_list_products_no_auth(client: TestClient) -> None:
    response = client.get("/api/v1/payments/products")
    assert response.status_code == 401


def test_list_products_returns_403_when_module_not_enabled(client: TestClient) -> None:
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
                "/api/v1/payments/products",
                headers={"Authorization": "Bearer fake-token"},
            )
    app.dependency_overrides.clear()
    assert response.status_code == 403


def test_list_products_success_empty(client: TestClient) -> None:
    from app.core.database import get_db

    async def override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = override_get_db
    with patch(
        "app.api.v1.payments.StripeProductRepository"
    ) as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.list_by_tenant = AsyncMock(return_value=[])
        mock_repo_cls.return_value = mock_repo
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(
                return_value=["stripe_payments"]
            )
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.get(
                    "/api/v1/payments/products",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"] == []


def test_list_products_success_with_data(client: TestClient) -> None:
    from datetime import UTC, datetime

    from app.core.database import get_db
    from app.models import StripeProduct

    async def override_get_db():
        yield MagicMock()

    product = StripeProduct(
        id="sp1",
        tenant_id="tid-1",
        stripe_product_id="prod_abc",
        stripe_price_id="price_xyz",
        name="Pro Plan",
        amount_cents=2900,
        currency="usd",
        interval="month",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    app.dependency_overrides[get_db] = override_get_db
    with patch(
        "app.api.v1.payments.StripeProductRepository"
    ) as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.list_by_tenant = AsyncMock(return_value=[product])
        mock_repo_cls.return_value = mock_repo
        with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
            mock_catalog = MagicMock()
            mock_catalog.get_active_module_codes_for_tenant = AsyncMock(
                return_value=["stripe_payments"]
            )
            mock_catalog_cls.return_value = mock_catalog
            with patch("app.core.deps.decode_token") as mock_decode:
                mock_decode.return_value = {
                    "sub": "u1",
                    "type": "access",
                    "tenant_id": "tid-1",
                }
                response = client.get(
                    "/api/v1/payments/products",
                    headers={"Authorization": "Bearer fake-token"},
                )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["id"] == "sp1"
    assert data["data"][0]["name"] == "Pro Plan"
    assert data["data"][0]["amount_cents"] == 2900
