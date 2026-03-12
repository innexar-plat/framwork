"""Shared helpers for platform routers."""

from app.config import get_settings
from app.schemas.briefing import BriefingResponse
from app.schemas.platform import (
    DomainSection,
    GitSection,
    IntegrationSection,
    PlatformIntegrationsStatus,
    SmtpSection,
    _mask,
)


def briefing_to_response(briefing) -> BriefingResponse:
    return BriefingResponse(
        id=briefing.id,
        client_name=briefing.client_name,
        client_email=briefing.client_email,
        client_phone=briefing.client_phone,
        plan_code=briefing.plan_code,
        niche_code=briefing.niche_code,
        slug_requested=briefing.slug_requested,
        business_name=briefing.business_name,
        business_description=briefing.business_description,
        slogan=briefing.slogan,
        logo_url=briefing.logo_url,
        primary_color=briefing.primary_color,
        secondary_color=briefing.secondary_color,
        address=briefing.address,
        city=briefing.city,
        state=briefing.state,
        zip_code=briefing.zip_code,
        social_links=briefing.social_links,
        modules_requested=briefing.modules_requested,
        use_custom_domain=briefing.use_custom_domain,
        custom_domain_requested=briefing.custom_domain_requested,
        notes=briefing.notes,
        status=briefing.status,
        tenant_id=briefing.tenant_id,
        provisioned_at=briefing.provisioned_at,
        created_at=briefing.created_at,
        updated_at=briefing.updated_at,
    )


def build_integrations_status() -> PlatformIntegrationsStatus:
    """Build integrations status from settings. Never expose raw secrets."""
    settings = get_settings()
    cf_configured = bool(settings.cf_zone_id and settings.cf_api_token)
    return PlatformIntegrationsStatus(
        cloudflare=IntegrationSection(
            configured=cf_configured,
            zone_id=settings.cf_zone_id or None,
            base_domain=settings.cf_base_domain or None,
            cname_target=settings.cf_cname_target or None,
            token_masked=_mask(settings.cf_api_token) if settings.cf_api_token else None,
        ),
        git=GitSection(
            configured=bool(
                settings.git_token
                and settings.git_template_owner
                and settings.git_template_repo
            ),
            template_owner=settings.git_template_owner or None,
            template_repo=settings.git_template_repo or None,
            token_masked=_mask(settings.git_token) if settings.git_token else None,
        ),
        smtp=SmtpSection(
            configured=bool(settings.smtp_host and settings.smtp_user and settings.smtp_pass),
            host=settings.smtp_host or None,
            port=settings.smtp_port if settings.smtp_host else None,
            from_address=settings.smtp_from or None,
            user_masked=_mask(settings.smtp_user) if settings.smtp_user else None,
        ),
        domain=DomainSection(
            panel_base_url=settings.panel_base_url or None,
            site_base_domain=settings.site_base_domain or None,
        ),
    )
