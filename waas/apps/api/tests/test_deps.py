"""Tests for app.core.deps (auth dependencies)."""

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.deps import (
    get_current_user_id_from_token,
    get_tenant_id_from_token,
)
from app.core.security import create_access_token

app = FastAPI()


@app.get("/protected")
def protected(user_id: str = Depends(get_current_user_id_from_token)) -> dict:
    return {"user_id": user_id}


@app.get("/tenant")
def tenant_only(tenant_id: str | None = Depends(get_tenant_id_from_token)) -> dict:
    return {"tenant_id": tenant_id}


def test_get_authorization_bearer_missing_returns_401() -> None:
    client = TestClient(app)
    response = client.get("/protected")
    assert response.status_code == 401
    assert "detail" in response.json()


def test_get_authorization_bearer_invalid_prefix_returns_401() -> None:
    client = TestClient(app)
    response = client.get("/protected", headers={"Authorization": "Invalid token"})
    assert response.status_code == 401


def test_get_current_user_id_from_token_valid_returns_user_id() -> None:
    token = create_access_token("user-123")
    client = TestClient(app)
    response = client.get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["user_id"] == "user-123"


def test_get_current_user_id_from_token_invalid_returns_401() -> None:
    client = TestClient(app)
    response = client.get("/protected", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401


def test_get_tenant_id_from_token_with_tenant_returns_tenant_id() -> None:
    token = create_access_token("user-1", tenant_id="tenant-abc")
    client = TestClient(app)
    response = client.get("/tenant", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["tenant_id"] == "tenant-abc"


def test_get_tenant_id_from_token_without_tenant_returns_none() -> None:
    token = create_access_token("user-1")
    client = TestClient(app)
    response = client.get("/tenant", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["tenant_id"] is None
