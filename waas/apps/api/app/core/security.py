"""Security: password hashing, JWT, API key verification."""

import hashlib
import hmac
import logging
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

JWT_SUB_CLAIM = "sub"
JWT_TENANT_CLAIM = "tenant_id"
JWT_ROLE_CLAIM = "role"
JWT_TYPE_CLAIM = "type"  # "access" | "refresh"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _secret_salt() -> str:
    return get_settings().jwt_secret_key or "change-me-in-production"


def create_access_token(
    subject: str,
    tenant_id: str | None = None,
    role: str | None = None,
) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload: dict[str, Any] = {
        JWT_SUB_CLAIM: str(subject),
        JWT_TYPE_CLAIM: "access",
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    if tenant_id:
        payload[JWT_TENANT_CLAIM] = str(tenant_id)
    if role:
        payload[JWT_ROLE_CLAIM] = role
    return jwt.encode(
        payload,
        _secret_salt(),
        algorithm=settings.jwt_algorithm,
    )


def create_refresh_token(subject: str) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_token_expire_days)
    payload = {
        JWT_SUB_CLAIM: str(subject),
        JWT_TYPE_CLAIM: "refresh",
        "exp": expire,
        "iat": datetime.now(UTC),
    }
    return jwt.encode(
        payload,
        _secret_salt(),
        algorithm=settings.jwt_algorithm,
    )


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(
            token,
            _secret_salt(),
            algorithms=[get_settings().jwt_algorithm],
        )
    except JWTError:
        return None


def hash_secret(secret: str) -> str:
    """Hash API secret for storage. Do not store raw secret."""
    return hashlib.sha256(secret.encode()).hexdigest()


def verify_api_secret(plain_secret: str, secret_hash: str) -> bool:
    """Constant-time comparison of secret with stored hash."""
    computed = hashlib.sha256(plain_secret.encode()).hexdigest()
    return hmac.compare_digest(computed, secret_hash)
