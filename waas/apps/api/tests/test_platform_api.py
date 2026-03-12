"""Tests for platform admin endpoints (tenants, audit)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_platform_tenants_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/platform/tenants")
    assert response.status_code == 401


def test_platform_audit_requires_auth(client: TestClient) -> None:
    response = client.get("/api/v1/platform/audit")
    assert response.status_code == 401
