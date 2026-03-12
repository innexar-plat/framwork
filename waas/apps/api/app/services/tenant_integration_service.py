"""Tenant integration config service — encrypt/decrypt secrets with Fernet."""

import json
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import TenantIntegration
from app.repositories.tenant_integration_repository import TenantIntegrationRepository

logger = logging.getLogger(__name__)

VALID_INTEGRATION_CODES = frozenset(
    {
        "google_oauth",
        "meta_pixel",
        "stripe",
        "google_maps",
        "whatsapp",
        "mailchimp",
        "brevo",
        "ga4",
        "google_reviews",
        "calendly",
        "tidio",
    }
)


def _get_fernet():
    """Return Fernet instance if encryption_key is set."""
    from cryptography.fernet import Fernet

    key = get_settings().encryption_key
    if not key:
        return None
    try:
        if isinstance(key, str) and len(key) != 44:
            # Fernet key must be 44 chars base64
            return None
        return Fernet(key.encode() if isinstance(key, str) else key)
    except Exception:
        return None


def _encrypt(plain: str) -> str | None:
    """Encrypt string. Returns None if no key or error."""
    f = _get_fernet()
    if not f:
        return None
    try:
        return f.encrypt(plain.encode()).decode()
    except Exception as e:
        logger.warning("Encrypt failed: %s", e)
        return None


def _decrypt(cipher: str) -> str | None:
    """Decrypt string. Returns None if no key or error."""
    f = _get_fernet()
    if not f:
        return None
    try:
        return f.decrypt(cipher.encode()).decode()
    except Exception as e:
        logger.warning("Decrypt failed: %s", e)
        return None


class TenantIntegrationService:
    """Get/set/list tenant integration config. Secrets never returned in API."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = TenantIntegrationRepository(db)

    def _validate_code(self, code: str) -> None:
        if code not in VALID_INTEGRATION_CODES:
            raise ValueError(f"Invalid integration_code: {code}")

    async def get_config(self, tenant_id: str, integration_code: str) -> dict | None:
        """Return merged config (decrypted secrets + public). None if not configured."""
        self._validate_code(integration_code)
        row = await self._repo.get(tenant_id, integration_code)
        if not row:
            return None
        out = {}
        if row.config_public:
            try:
                out.update(json.loads(row.config_public))
            except json.JSONDecodeError:
                pass
        if row.config_encrypted:
            dec = _decrypt(row.config_encrypted)
            if dec:
                try:
                    out.update(json.loads(dec))
                except json.JSONDecodeError:
                    pass
        return out if out else None

    async def set_config(
        self,
        tenant_id: str,
        integration_code: str,
        public_data: dict | None = None,
        secret_data: dict | None = None,
        is_enabled: bool | None = None,
    ) -> TenantIntegration:
        """Create or update integration config. Encrypts secret_data."""
        self._validate_code(integration_code)
        row = await self._repo.get(tenant_id, integration_code)
        if not row:
            from app.models.base import generate_uuid_hex

            row = TenantIntegration(
                id=generate_uuid_hex(),
                tenant_id=tenant_id,
                integration_code=integration_code,
            )
            self._db.add(row)
            await self._db.flush()

        if public_data is not None:
            row.config_public = json.dumps(public_data) if public_data else None
        if secret_data is not None:
            raw = json.dumps(secret_data) if secret_data else ""
            row.config_encrypted = _encrypt(raw) if raw else None
        if is_enabled is not None:
            row.is_enabled = is_enabled

        await self._repo.update(row)
        return row

    async def list_integrations(self, tenant_id: str) -> list[dict]:
        """List integrations for tenant. Never include decrypted secrets."""
        rows = await self._repo.list_by_tenant(tenant_id)
        result = []
        for row in rows:
            config_public = None
            if row.config_public:
                try:
                    config_public = json.loads(row.config_public)
                except json.JSONDecodeError:
                    pass
            result.append(
                {
                    "integration_code": row.integration_code,
                    "is_enabled": row.is_enabled,
                    "configured": bool(row.config_encrypted or row.config_public),
                    "config_public": config_public,
                }
            )
        return result
