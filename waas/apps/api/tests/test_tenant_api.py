"""Tests for tenant settings and site pages (auth required)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_tenant_settings_get_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/tenant/settings")
    assert response.status_code == 401  # no token


def test_tenant_pages_list_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/tenant/pages")
    assert response.status_code in (401, 403)


def test_tenant_users_list_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/tenant/users")
    assert response.status_code in (401, 403)
