"""Provisioning service — run 10-step tenant provisioning from briefing."""

import logging
import secrets
import string
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models import ProvisioningLog, Tenant, User, UserTenant
from app.repositories.briefing_repository import BriefingRepository
from app.repositories.provisioning_log_repository import ProvisioningLogRepository
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.repositories.user_tenant_repository import UserTenantRepository
from app.services.catalog_service import CatalogService
from app.services.cloudflare_service import CloudflareService
from app.services.email_service import EmailService
from app.services.git_service import GitService

logger = logging.getLogger(__name__)

PROVISIONING_STEPS = [
    (1, "Validate briefing"),
    (2, "Generate unique slug"),
    (3, "Create tenant in database"),
    (4, "Configure Cloudflare DNS"),
    (5, "Create Git repository"),
    (6, "Generate credentials"),
    (7, "Create admin user"),
    (8, "Link user to tenant"),
    (9, "Send welcome email"),
    (10, "Finalize provisioning"),
]


def _generate_temp_password(length: int = 12) -> str:
    """Generate a secure temporary password (letters + digits + special)."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


class ProvisioningResult:
    """Result of successful provisioning."""

    def __init__(
        self,
        tenant_id: str,
        subdomain: str,
        panel_url: str,
        admin_email: str,
    ):
        self.tenant_id = tenant_id
        self.subdomain = subdomain
        self.panel_url = panel_url
        self.admin_email = admin_email


class ProvisioningService:
    """Execute the 10-step provisioning flow; log each step."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._briefing_repo = BriefingRepository(db)
        self._tenant_repo = TenantRepository(db)
        self._user_repo = UserRepository(db)
        self._user_tenant_repo = UserTenantRepository(db)
        self._log_repo = ProvisioningLogRepository(db)
        self._catalog = CatalogService(db)
        self._cf = CloudflareService()
        self._git = GitService()
        self._email = EmailService()

    async def _log(
        self,
        briefing_id: str,
        step_number: int,
        step_name: str,
        status: str,
        message: str | None = None,
    ) -> None:
        log = ProvisioningLog(
            id=uuid4().hex,
            briefing_id=briefing_id,
            step_number=step_number,
            step_name=step_name,
            status=status,
            message=message,
        )
        await self._log_repo.add(log)

    async def _unique_slug(self, requested: str | None) -> str:
        """Return a slug that does not exist in tenants. Add suffix if collision."""
        base = (requested or "").strip().lower() or "site"
        base = "".join(c for c in base if c.isalnum() or c == "-") or "site"
        slug = base[:50]
        for n in range(100):
            candidate = f"{slug}-{n}" if n else slug
            existing = await self._tenant_repo.get_by_slug(candidate)
            if not existing:
                return candidate
        return f"{slug}-{uuid4().hex[:8]}"

    async def provision(
        self, briefing_id: str, override_slug: str | None = None
    ) -> ProvisioningResult:
        """
        Run all 10 steps. On failure, update briefing/tenant status and raise.
        """
        briefing = await self._briefing_repo.get_by_id(briefing_id)
        if not briefing:
            raise ValueError("Briefing not found")
        if briefing.status != "pending":
            raise ValueError(f"Briefing status must be pending, got {briefing.status}")

        briefing.status = "provisioning"
        await self._briefing_repo.update(briefing)

        tenant: Tenant | None = None
        try:
            # Step 1 — already validated above
            await self._log(
                briefing_id, 1, PROVISIONING_STEPS[0][1], "success", "Briefing validated"
            )

            # Step 2
            slug = await self._unique_slug(override_slug or briefing.slug_requested)
            await self._log(briefing_id, 2, PROVISIONING_STEPS[1][1], "success", f"Slug: {slug}")

            # Step 3
            plan_id = await self._catalog.get_plan_id_by_code(briefing.plan_code)
            niche_id = await self._catalog.get_niche_id_by_code(briefing.niche_code)
            if not plan_id or not niche_id:
                await self._log(
                    briefing_id,
                    3,
                    PROVISIONING_STEPS[2][1],
                    "failed",
                    "Invalid plan_code or niche_code",
                )
                raise ValueError("Invalid plan_code or niche_code")
            tenant = Tenant(
                id=uuid4().hex,
                name=briefing.business_name,
                slug=slug,
                status="active",
                plan_id=plan_id,
                niche_id=niche_id,
                provisioning_status="provisioning",
                subdomain=slug,
                logo_url=briefing.logo_url,
                primary_color=briefing.primary_color,
            )
            await self._tenant_repo.add(tenant)
            await self._log(briefing_id, 3, PROVISIONING_STEPS[2][1], "success", tenant.id)

            # Step 4
            try:
                cf_id = await self._cf.create_subdomain(slug)
                tenant.cf_record_id = cf_id
                self._db.add(tenant)
                await self._db.flush()
                await self._db.refresh(tenant)
                await self._log(briefing_id, 4, PROVISIONING_STEPS[3][1], "success", cf_id)
            except Exception as e:
                await self._log(briefing_id, 4, PROVISIONING_STEPS[3][1], "failed", str(e))
                tenant.provisioning_status = "failed"
                self._db.add(tenant)
                await self._db.flush()
                raise

            # Step 5
            try:
                git_url = await self._git.create_site_repo(tenant.id, slug)
                tenant.git_repo_url = git_url
                self._db.add(tenant)
                await self._db.flush()
                await self._db.refresh(tenant)
                await self._log(briefing_id, 5, PROVISIONING_STEPS[4][1], "success", git_url)
            except Exception as e:
                await self._log(briefing_id, 5, PROVISIONING_STEPS[4][1], "failed", str(e))
                tenant.provisioning_status = "failed"
                self._db.add(tenant)
                await self._db.flush()
                raise

            # Step 6 & 7
            existing_user = await self._user_repo.get_by_email(briefing.client_email)
            if existing_user:
                user = existing_user
                temp_password = "(use your existing password)"
            else:
                temp_password = _generate_temp_password(12)
                user = User(
                    id=uuid4().hex,
                    email=briefing.client_email,
                    password_hash=hash_password(temp_password),
                    name=briefing.client_name or briefing.client_email.split("@")[0],
                )
                await self._user_repo.add(user)
            await self._log(
                briefing_id, 6, PROVISIONING_STEPS[5][1], "success", "Credentials generated"
            )
            await self._log(briefing_id, 7, PROVISIONING_STEPS[6][1], "success", user.id)

            # Step 8
            ut = await self._user_tenant_repo.get_by_user_and_tenant(user.id, tenant.id)
            if not ut:
                user_tenant = UserTenant(
                    id=uuid4().hex,
                    user_id=user.id,
                    tenant_id=tenant.id,
                    role="admin",
                )
                await self._user_tenant_repo.add(user_tenant)
            await self._log(briefing_id, 8, PROVISIONING_STEPS[7][1], "success")

            # Step 9
            from app.config import get_settings

            panel_url = get_settings().panel_base_url
            try:
                await self._email.send_welcome_tenant(
                    to_email=briefing.client_email,
                    name=briefing.client_name or "there",
                    panel_url=panel_url,
                    subdomain=slug,
                    temp_password=temp_password,
                )
                tenant.welcome_email_sent = True
                self._db.add(tenant)
                await self._db.flush()
                await self._log(briefing_id, 9, PROVISIONING_STEPS[8][1], "success")
            except Exception as e:
                await self._log(briefing_id, 9, PROVISIONING_STEPS[8][1], "failed", str(e))
                # Continue — do not fail provisioning for email failure

            # Step 10
            now = datetime.now(UTC)
            tenant.provisioning_status = "active"
            tenant.provisioned_at = now
            self._db.add(tenant)
            briefing.status = "provisioned"
            briefing.tenant_id = tenant.id
            briefing.provisioned_at = now
            self._db.add(briefing)
            await self._db.flush()
            await self._log(briefing_id, 10, PROVISIONING_STEPS[9][1], "success")

            return ProvisioningResult(
                tenant_id=tenant.id,
                subdomain=slug,
                panel_url=panel_url,
                admin_email=briefing.client_email,
            )

        except Exception:
            briefing.status = "failed"
            self._db.add(briefing)
            if tenant is not None:
                tenant.provisioning_status = "failed"
                self._db.add(tenant)
            await self._db.flush()
            raise
