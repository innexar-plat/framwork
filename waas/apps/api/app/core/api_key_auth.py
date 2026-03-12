"""Integration API authentication: public key + secret (header)."""

import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.i18n import Locale, translate
from app.core.security import verify_api_secret
from app.models import IntegrationApp
from app.repositories.integration_app_repository import IntegrationAppRepository

logger = logging.getLogger(__name__)


async def get_integration_app(
    locale: Locale,
    x_api_key: Annotated[str | None, Header(alias="X-Api-Key")] = None,
    x_api_secret: Annotated[str | None, Header(alias="X-Api-Secret")] = None,
    db: AsyncSession = Depends(get_db),
) -> IntegrationApp:
    """Verify API key + secret and return IntegrationApp. For integration routes only."""
    public_key = x_api_key or ""
    secret = x_api_secret or ""

    if not public_key or not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("integration.missing_api_key", locale),
        )

    repo = IntegrationAppRepository(db)
    app = await repo.get_by_public_key(public_key)
    if not app:
        logger.warning("Integration API: unknown public key")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("integration.invalid_api_key", locale),
        )

    if not verify_api_secret(secret, app.secret_key_hash):
        logger.warning("Integration API: invalid secret for app %s", app.app_name)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("integration.invalid_api_secret", locale),
        )

    return app
