"""Tests for app.api.v1.auth endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_login_success_returns_200_and_tokens(client: TestClient) -> None:
    with patch("app.api.v1.auth.AuthService") as mock_service:
        mock_service.return_value.login = AsyncMock(
            return_value=("access-token", "refresh-token", None, None)
        )
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "user@example.com", "password": "secret"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["access_token"] == "access-token"
    assert data["data"]["refresh_token"] == "refresh-token"


def test_login_invalid_credentials_returns_401(client: TestClient) -> None:
    with patch("app.api.v1.auth.AuthService") as mock_service:
        mock_service.return_value.login = AsyncMock(return_value=None)
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "user@example.com", "password": "wrong"},
        )
    assert response.status_code == 401


def test_login_returns_translated_message_when_accept_language_pt(
    client: TestClient,
) -> None:
    """API returns Portuguese message when Accept-Language: pt."""
    with patch("app.api.v1.auth.AuthService") as mock_service:
        mock_service.return_value.login = AsyncMock(return_value=None)
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "u@x.com", "password": "wrong"},
            headers={"Accept-Language": "pt"},
        )
    assert response.status_code == 401
    detail = response.json().get("detail", "")
    assert "inválidos" in detail or "senha" in detail.lower()


def test_login_invalid_body_returns_422(client: TestClient) -> None:
    response = client.post("/api/v1/auth/login", json={"email": "not-an-email"})
    assert response.status_code == 422


def test_refresh_success_returns_200(client: TestClient) -> None:
    with patch("app.api.v1.auth.AuthService") as mock_service:
        mock_service.return_value.refresh_tokens = AsyncMock(
            return_value=("new-access", "new-refresh")
        )
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "valid-refresh-token"},
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["access_token"] == "new-access"
    assert data["data"]["refresh_token"] == "new-refresh"


def test_refresh_invalid_token_returns_401(client: TestClient) -> None:
    with patch("app.api.v1.auth.AuthService") as mock_service:
        mock_service.return_value.refresh_tokens = AsyncMock(return_value=None)
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid"},
        )
    assert response.status_code == 401


def test_me_without_auth_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
