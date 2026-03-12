"""Dependencies: DB session, tenant context, auth, API key."""

import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.i18n import Locale, translate
from app.core.security import decode_token

logger = logging.getLogger(__name__)

# Type alias for DB session
DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_authorization_bearer(
    locale: Locale,
    authorization: str | None = Header(None),
) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("deps.missing_authorization", locale),
        )
    return authorization[7:].strip()


def get_current_user_id_from_token(
    locale: Locale,
    token: str = Depends(get_authorization_bearer),
) -> str:
    """Decode JWT and return subject (user id)."""
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("deps.invalid_token", locale),
        )
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("deps.invalid_token_payload", locale),
        )
    return sub


def get_tenant_id_from_token(
    token: str = Depends(get_authorization_bearer),
) -> str | None:
    """Extract tenant_id from JWT if present."""
    payload = decode_token(token)
    if not payload:
        return None
    return payload.get("tenant_id")


def get_role_from_token(
    token: str = Depends(get_authorization_bearer),
) -> str | None:
    """Extract role from JWT if present."""
    payload = decode_token(token)
    if not payload:
        return None
    return payload.get("role")


# For protected routes that require both user and tenant
CurrentUserId = Annotated[str, Depends(get_current_user_id_from_token)]
TenantIdFromToken = Annotated[str | None, Depends(get_tenant_id_from_token)]
RoleFromToken = Annotated[str | None, Depends(get_role_from_token)]
