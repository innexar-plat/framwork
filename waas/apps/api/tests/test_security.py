"""Tests for app.core.security: password, JWT, API secret."""

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_secret,
    verify_api_secret,
    verify_password,
)


def test_hash_password_returns_non_empty_string() -> None:
    result = hash_password("secret123")
    assert isinstance(result, str)
    assert len(result) > 0
    assert result != "secret123"


def test_verify_password_success() -> None:
    hashed = hash_password("mypass")
    assert verify_password("mypass", hashed) is True


def test_verify_password_failure() -> None:
    hashed = hash_password("mypass")
    assert verify_password("wrong", hashed) is False


def test_create_access_token_returns_jwt() -> None:
    token = create_access_token("user-123")
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_with_tenant_and_role() -> None:
    token = create_access_token("user-1", tenant_id="tenant-1", role="admin")
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == "user-1"
    assert payload.get("tenant_id") == "tenant-1"
    assert payload.get("role") == "admin"
    assert payload.get("type") == "access"


def test_decode_token_valid() -> None:
    token = create_access_token("user-1")
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == "user-1"
    assert "exp" in payload
    assert "iat" in payload


def test_decode_token_invalid_returns_none() -> None:
    assert decode_token("invalid.jwt.token") is None
    assert decode_token("") is None


def test_create_refresh_token_returns_jwt() -> None:
    token = create_refresh_token("user-1")
    payload = decode_token(token)
    assert payload is not None
    assert payload.get("sub") == "user-1"
    assert payload.get("type") == "refresh"


def test_hash_secret_deterministic() -> None:
    secret = "my-api-secret"
    h1 = hash_secret(secret)
    h2 = hash_secret(secret)
    assert h1 == h2
    assert len(h1) == 64
    assert h1 != secret


def test_verify_api_secret_success() -> None:
    secret = "sk_live_abc"
    hashed = hash_secret(secret)
    assert verify_api_secret(secret, hashed) is True


def test_verify_api_secret_failure() -> None:
    hashed = hash_secret("correct-secret")
    assert verify_api_secret("wrong-secret", hashed) is False
