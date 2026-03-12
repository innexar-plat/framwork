"""V1 API router aggregation."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.blog import router as blog_router
from app.api.v1.catalog import router as catalog_router
from app.api.v1.catalog_admin import router as catalog_admin_router
from app.api.v1.integration import router as integration_router
from app.api.v1.leads import router as leads_router
from app.api.v1.media import router as media_router
from app.api.v1.platform import router as platform_router
from app.api.v1.property import router as property_router
from app.api.v1.public import router as public_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.schedule import router as schedule_router
from app.api.v1.site_pages import router as site_pages_router
from app.api.v1.tenant import router as tenant_router
from app.api.v1.tenant_users import router as tenant_users_router

api_router = APIRouter(prefix="/api/v1", tags=["v1"])

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(blog_router, prefix="/blog", tags=["blog"])
api_router.include_router(catalog_router, prefix="/catalog", tags=["catalog"])
api_router.include_router(
    catalog_admin_router,
    prefix="/admin/catalog",
    tags=["catalog-admin"],
)
api_router.include_router(platform_router, prefix="/platform", tags=["platform"])
api_router.include_router(public_router, prefix="/public", tags=["public"])
api_router.include_router(integration_router, prefix="/integration", tags=["integration"])
api_router.include_router(leads_router, prefix="/leads", tags=["leads"])
api_router.include_router(media_router, prefix="/media", tags=["media"])
api_router.include_router(property_router, prefix="/property", tags=["property"])
api_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])
api_router.include_router(schedule_router, prefix="/schedule", tags=["schedule"])
api_router.include_router(tenant_router, prefix="/tenant", tags=["tenant"])
api_router.include_router(site_pages_router, prefix="/tenant", tags=["site-pages"])
api_router.include_router(tenant_users_router, prefix="/tenant", tags=["tenant-users"])
