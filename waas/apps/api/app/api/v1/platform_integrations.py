"""Platform integration status and connectivity tests."""

from fastapi import APIRouter

from app.config import get_settings
from app.core.catalog_admin import CatalogAdminUserId
from app.schemas.common import ApiResponse
from app.schemas.platform import PlatformIntegrationsStatus
from app.services.cloudflare_service import CloudflareService
from app.services.email_service import EmailService

from .platform_common import build_integrations_status

router = APIRouter()


@router.get("/integrations/status", response_model=ApiResponse[PlatformIntegrationsStatus])
async def get_integrations_status(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[PlatformIntegrationsStatus]:
    """Get platform integrations status (masked)."""
    return ApiResponse(success=True, data=build_integrations_status(), error=None)


@router.post("/integrations/test/cloudflare", response_model=ApiResponse[dict])
async def test_cloudflare(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[dict]:
    """Test Cloudflare DNS connection (GET zone)."""
    service = CloudflareService()
    try:
        ok = await service.test_connection()
        message = "Connection successful" if ok else "Invalid zone or token"
        return ApiResponse(success=True, data={"ok": ok, "message": message}, error=None)
    except Exception as exc:
        return ApiResponse(success=False, data=None, error=str(exc))


@router.post("/integrations/test/smtp", response_model=ApiResponse[dict])
async def test_smtp(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[dict]:
    """Send a test email to operator_email to verify SMTP."""
    settings = get_settings()
    if not settings.operator_email:
        return ApiResponse(success=False, data=None, error="OPERATOR_EMAIL not set")

    service = EmailService()
    try:
        await service.send_test_email(settings.operator_email)
        return ApiResponse(
            success=True,
            data={"ok": True, "message": f"Test email sent to {settings.operator_email}"},
            error=None,
        )
    except Exception as exc:
        return ApiResponse(success=False, data=None, error=str(exc))
