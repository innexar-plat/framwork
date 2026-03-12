"""Platform admin: tenants, audit, briefings, provision, integrations. Requires catalog_admin where noted."""

import logging

from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.core.catalog_admin import CatalogAdminUserId
from app.core.deps import DbSession
from app.repositories.catalog_audit_repository import CatalogAuditRepository
from app.repositories.provisioning_log_repository import ProvisioningLogRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.briefing import BriefingCreate, BriefingResponse, BriefingUpdate
from app.schemas.common import ApiResponse
from app.schemas.platform import (
    AuditLogItem,
    DomainSection,
    GitSection,
    IntegrationSection,
    PlatformIntegrationsStatus,
    ProvisionRequest,
    ProvisionResultOut,
    ProvisionStatusResponse,
    ProvisionStepOut,
    SmtpSection,
    TenantListItem,
    _mask,
)
from app.services.briefing_service import BriefingService
from app.services.cloudflare_service import CloudflareService
from app.services.email_service import EmailService
from app.services.provisioning_service import ProvisioningService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/tenants", response_model=ApiResponse[list[TenantListItem]])
async def list_tenants(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    limit: int = 100,
) -> ApiResponse[list[TenantListItem]]:
    """List all tenants (platform admin only)."""
    repo = TenantRepository(db)
    tenants = await repo.list_all(limit=limit)
    items = [
        TenantListItem(
            id=t.id,
            name=t.name,
            slug=t.slug,
            status=t.status,
            plan_id=t.plan_id,
            niche_id=t.niche_id,
            created_at=t.created_at,
        )
        for t in tenants
    ]
    return ApiResponse(success=True, data=items, error=None)


@router.get("/audit", response_model=ApiResponse[list[AuditLogItem]])
async def list_audit(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    limit: int = 50,
) -> ApiResponse[list[AuditLogItem]]:
    """List recent catalog audit log entries (platform admin only)."""
    repo = CatalogAuditRepository(db)
    rows = await repo.list_recent(limit=limit)
    items = [
        AuditLogItem(
            id=r.id,
            user_id=r.user_id,
            action=r.action,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            details=r.details,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return ApiResponse(success=True, data=items, error=None)


def _briefing_to_response(b) -> BriefingResponse:
    return BriefingResponse(
        id=b.id,
        client_name=b.client_name,
        client_email=b.client_email,
        client_phone=b.client_phone,
        plan_code=b.plan_code,
        niche_code=b.niche_code,
        slug_requested=b.slug_requested,
        business_name=b.business_name,
        business_description=b.business_description,
        slogan=b.slogan,
        logo_url=b.logo_url,
        primary_color=b.primary_color,
        secondary_color=b.secondary_color,
        address=b.address,
        city=b.city,
        state=b.state,
        zip_code=b.zip_code,
        social_links=b.social_links,
        modules_requested=b.modules_requested,
        use_custom_domain=b.use_custom_domain,
        custom_domain_requested=b.custom_domain_requested,
        notes=b.notes,
        status=b.status,
        tenant_id=b.tenant_id,
        provisioned_at=b.provisioned_at,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


@router.get("/briefings", response_model=ApiResponse[list[BriefingResponse]])
async def list_briefings(
    _user_id: CatalogAdminUserId,
    db: DbSession,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> ApiResponse[list[BriefingResponse]]:
    """List briefings (platform admin). Optional filter by status."""
    service = BriefingService(db)
    items = await service.list_all(status_filter=status, limit=limit, offset=offset)
    return ApiResponse(success=True, data=[_briefing_to_response(b) for b in items], error=None)


@router.post(
    "/briefings", response_model=ApiResponse[BriefingResponse], status_code=status.HTTP_201_CREATED
)
async def create_briefing(
    body: BriefingCreate,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Create briefing (e.g. from public onboarding portal; no auth required for public use)."""
    service = BriefingService(db)
    briefing = await service.create(body)
    return ApiResponse(success=True, data=_briefing_to_response(briefing), error=None)


@router.get("/briefings/{briefing_id}", response_model=ApiResponse[BriefingResponse])
async def get_briefing(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Get briefing by id (platform admin)."""
    service = BriefingService(db)
    briefing = await service.get_by_id(briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return ApiResponse(success=True, data=_briefing_to_response(briefing), error=None)


@router.patch("/briefings/{briefing_id}", response_model=ApiResponse[BriefingResponse])
async def update_briefing(
    briefing_id: str,
    body: BriefingUpdate,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[BriefingResponse]:
    """Update briefing (platform admin)."""
    service = BriefingService(db)
    briefing = await service.update(briefing_id, body)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    return ApiResponse(success=True, data=_briefing_to_response(briefing), error=None)


@router.delete("/briefings/{briefing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_briefing(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> None:
    """Delete briefing (platform admin)."""
    service = BriefingService(db)
    ok = await service.delete(briefing_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")


@router.post("/provision", response_model=ApiResponse[ProvisionResultOut])
async def provision_tenant(
    body: ProvisionRequest,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[ProvisionResultOut]:
    """Run provisioning for a briefing (platform admin)."""
    service = ProvisioningService(db)
    try:
        result = await service.provision(body.briefing_id, override_slug=body.override_slug)
        return ApiResponse(
            success=True,
            data=ProvisionResultOut(
                tenant_id=result.tenant_id,
                subdomain=result.subdomain,
                panel_url=result.panel_url,
                admin_email=result.admin_email,
            ),
            error=None,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("Provisioning failed for briefing %s: %s", body.briefing_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Provisioning failed. Check server logs.",
        )


@router.get("/provision/{briefing_id}/status", response_model=ApiResponse[ProvisionStatusResponse])
async def get_provision_status(
    briefing_id: str,
    _user_id: CatalogAdminUserId,
    db: DbSession,
) -> ApiResponse[ProvisionStatusResponse]:
    """Get provisioning status and steps for a briefing (platform admin)."""
    briefing_repo = BriefingService(db)
    briefing = await briefing_repo.get_by_id(briefing_id)
    if not briefing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Briefing not found")
    log_repo = ProvisioningLogRepository(db)
    logs = await log_repo.list_by_briefing(briefing_id)
    tenant = None
    if briefing.tenant_id:
        tr = TenantRepository(db)
        tenant = await tr.get_by_id(briefing.tenant_id)
    return ApiResponse(
        success=True,
        data=ProvisionStatusResponse(
            briefing_status=briefing.status,
            provisioning_status=tenant.provisioning_status if tenant else None,
            tenant_id=briefing.tenant_id,
            steps=[
                ProvisionStepOut(
                    step_number=log.step_number,
                    step_name=log.step_name,
                    status=log.status,
                    message=log.message,
                )
                for log in logs
            ],
        ),
        error=None,
    )


def _build_integrations_status() -> PlatformIntegrationsStatus:
    """Build integrations status from settings. Never expose raw secrets."""
    s = get_settings()
    cf_configured = bool(s.cf_zone_id and s.cf_api_token)
    return PlatformIntegrationsStatus(
        cloudflare=IntegrationSection(
            configured=cf_configured,
            zone_id=s.cf_zone_id or None,
            base_domain=s.cf_base_domain or None,
            cname_target=s.cf_cname_target or None,
            token_masked=_mask(s.cf_api_token) if s.cf_api_token else None,
        ),
        git=GitSection(
            configured=bool(s.git_token and s.git_template_owner and s.git_template_repo),
            template_owner=s.git_template_owner or None,
            template_repo=s.git_template_repo or None,
            token_masked=_mask(s.git_token) if s.git_token else None,
        ),
        smtp=SmtpSection(
            configured=bool(s.smtp_host and s.smtp_user and s.smtp_pass),
            host=s.smtp_host or None,
            port=s.smtp_port if s.smtp_host else None,
            from_address=s.smtp_from or None,
            user_masked=_mask(s.smtp_user) if s.smtp_user else None,
        ),
        domain=DomainSection(
            panel_base_url=s.panel_base_url or None,
            site_base_domain=s.site_base_domain or None,
        ),
    )


@router.get("/integrations/status", response_model=ApiResponse[PlatformIntegrationsStatus])
async def get_integrations_status(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[PlatformIntegrationsStatus]:
    """Get platform integrations status (masked). Config via env vars."""
    data = _build_integrations_status()
    return ApiResponse(success=True, data=data, error=None)


@router.post("/integrations/test/cloudflare", response_model=ApiResponse[dict])
async def test_cloudflare(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[dict]:
    """Test Cloudflare DNS connection (GET zone)."""
    svc = CloudflareService()
    try:
        ok = await svc.test_connection()
        return ApiResponse(
            success=True,
            data={"ok": ok, "message": "Connection successful" if ok else "Invalid zone or token"},
            error=None,
        )
    except Exception as e:
        return ApiResponse(
            success=False,
            data=None,
            error=str(e),
        )


@router.post("/integrations/test/smtp", response_model=ApiResponse[dict])
async def test_smtp(
    _user_id: CatalogAdminUserId,
) -> ApiResponse[dict]:
    """Send a test email to operator_email to verify SMTP."""
    s = get_settings()
    if not s.operator_email:
        return ApiResponse(success=False, data=None, error="OPERATOR_EMAIL not set")
    svc = EmailService()
    try:
        await svc.send_test_email(s.operator_email)
        return ApiResponse(
            success=True,
            data={"ok": True, "message": f"Test email sent to {s.operator_email}"},
            error=None,
        )
    except Exception as e:
        return ApiResponse(success=False, data=None, error=str(e))
