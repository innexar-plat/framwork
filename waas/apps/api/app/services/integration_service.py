"""Integration service: create/update workspace (tenant) via external API."""

import logging
from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tenant, User, UserTenant, WorkspaceExternal
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.repositories.user_tenant_repository import UserTenantRepository
from app.repositories.workspace_external_repository import WorkspaceExternalRepository
from app.schemas.integration import CreateWorkspaceRequest, UpdateWorkspaceRequest
from app.services.catalog_service import CatalogService
from app.services.cloudflare_service import CloudflareService

logger = logging.getLogger(__name__)

DEFAULT_SOURCE = "billing_v1"


class IntegrationService:
    """Provisioning: create/update/suspend/reactivate workspaces."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._tenant_repo = TenantRepository(db)
        self._workspace_repo = WorkspaceExternalRepository(db)
        self._user_repo = UserRepository(db)
        self._user_tenant_repo = UserTenantRepository(db)
        self._catalog = CatalogService(db)
        self._cf = CloudflareService()

    async def _unique_slug(self, requested: str) -> str:
        """Return a unique slug across tenant slug/subdomain fields."""
        normalized = (requested or "").strip().lower()
        base = "".join(c for c in normalized if c.isalnum() or c == "-") or "site"
        base = base[:50]
        for n in range(100):
            candidate = f"{base}-{n}" if n else base
            taken = await self._tenant_repo.slug_or_subdomain_taken(candidate)
            if not taken:
                return candidate
        return f"{base}-{uuid4().hex[:8]}"

    async def _ensure_dns_record(self, tenant: Tenant) -> None:
        """Create DNS record for the tenant if missing and store cf_record_id."""
        if tenant.cf_record_id:
            return
        subdomain = (tenant.subdomain or tenant.slug or "").strip().lower()
        if not subdomain:
            raise ValueError("Tenant slug/subdomain is required for DNS provisioning")
        cf_record_id = await self._cf.create_subdomain(subdomain)
        tenant.cf_record_id = cf_record_id
        self._db.add(tenant)
        await self._db.flush()

    async def _remove_dns_record(self, tenant: Tenant) -> None:
        """Delete DNS record when tenant has a stored Cloudflare record id."""
        if not tenant.cf_record_id:
            return
        deleted = await self._cf.delete_subdomain(tenant.cf_record_id)
        if not deleted:
            raise RuntimeError("Failed to remove Cloudflare DNS record")
        tenant.cf_record_id = None
        self._db.add(tenant)
        await self._db.flush()

    async def _resolve_plan_and_niche(
        self, plan_code: str | None, niche_code: str | None
    ) -> tuple[str | None, str | None]:
        """Resolve plan_code and niche_code to plan_id and niche_id."""
        plan_id = await self._catalog.get_plan_id_by_code(plan_code) if plan_code else None
        niche_id = await self._catalog.get_niche_id_by_code(niche_code) if niche_code else None
        return (plan_id, niche_id)

    async def create_workspace(
        self, body: CreateWorkspaceRequest
    ) -> tuple[Tenant, WorkspaceExternal, User | None]:
        """Create tenant + WorkspaceExternal. Idempotent by external_workspace_id."""
        existing = await self._workspace_repo.get_by_external_id_and_source(
            body.external_workspace_id, DEFAULT_SOURCE
        )
        if existing:
            tenant = await self._tenant_repo.get_by_id(existing.tenant_id)
            if tenant and tenant.status == "active":
                await self._ensure_dns_record(tenant)
            return (tenant, existing, None)

        plan_id, niche_id = await self._resolve_plan_and_niche(body.plan_code, body.niche_code)
        slug = await self._unique_slug(body.slug)
        tenant = Tenant(
            id=uuid4().hex,
            name=body.name,
            slug=slug,
            subdomain=slug,
            status="active",
            plan_id=plan_id,
            niche_id=niche_id,
            provisioning_status="active",
            provisioned_at=datetime.now(UTC),
        )
        await self._tenant_repo.add(tenant)
        await self._ensure_dns_record(tenant)

        we = WorkspaceExternal(
            id=uuid4().hex,
            tenant_id=tenant.id,
            external_workspace_id=body.external_workspace_id,
            source=DEFAULT_SOURCE,
        )
        await self._workspace_repo.add(we)

        admin_user: User | None = None
        if body.admin_email:
            admin_user = await self._user_repo.get_by_email(body.admin_email)
            if not admin_user:
                from app.core.security import hash_password

                admin_user = User(
                    id=uuid4().hex,
                    email=body.admin_email,
                    password_hash=hash_password(uuid4().hex),
                    name=body.admin_name or body.admin_email.split("@")[0],
                )
                await self._user_repo.add(admin_user)
            ut = await self._user_tenant_repo.get_by_user_and_tenant(admin_user.id, tenant.id)
            if not ut:
                user_tenant = UserTenant(
                    id=uuid4().hex,
                    user_id=admin_user.id,
                    tenant_id=tenant.id,
                    role="admin",
                )
                await self._user_tenant_repo.add(user_tenant)

        return (tenant, we, admin_user)

    async def get_workspace_by_external_id(
        self, external_workspace_id: str
    ) -> tuple[Tenant, WorkspaceExternal] | None:
        we = await self._workspace_repo.get_by_external_id_and_source(
            external_workspace_id, DEFAULT_SOURCE
        )
        if not we:
            return None
        tenant = await self._tenant_repo.get_by_id(we.tenant_id)
        if not tenant:
            return None
        return (tenant, we)

    async def update_workspace(
        self, external_workspace_id: str, body: UpdateWorkspaceRequest
    ) -> Tenant | None:
        pair = await self.get_workspace_by_external_id(external_workspace_id)
        if not pair:
            return None
        tenant, _ = pair
        if body.plan_code is not None:
            tenant.plan_id = await self._catalog.get_plan_id_by_code(body.plan_code)
        if body.niche_code is not None:
            tenant.niche_id = await self._catalog.get_niche_id_by_code(body.niche_code)
        await self._db.flush()
        await self._db.refresh(tenant)
        return tenant

    async def set_tenant_status(self, external_workspace_id: str, status: str) -> Tenant | None:
        pair = await self.get_workspace_by_external_id(external_workspace_id)
        if not pair:
            return None
        tenant, _ = pair

        if status == "suspended":
            await self._remove_dns_record(tenant)
        elif status == "active":
            if not tenant.subdomain and tenant.slug:
                tenant.subdomain = tenant.slug
            await self._ensure_dns_record(tenant)

        tenant.status = status
        await self._db.flush()
        await self._db.refresh(tenant)
        return tenant

    async def get_workspace_display(self, tenant, we) -> tuple[str | None, str | None, list[str]]:
        """Resolve plan_code, niche_code and active module codes for response."""
        plan_code = await self._catalog.get_plan_code_by_id(tenant.plan_id)
        niche_code = await self._catalog.get_niche_code_by_id(tenant.niche_id)
        modules = await self._catalog.get_active_module_codes_for_tenant(tenant.id)
        return (plan_code, niche_code, modules)
