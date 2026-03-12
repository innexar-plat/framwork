"""Platform router aggregator."""

from fastapi import APIRouter

from app.api.v1.platform_briefings import router as briefings_router
from app.api.v1.platform_integrations import router as integrations_router
from app.api.v1.platform_overview import router as overview_router

router = APIRouter()
router.include_router(overview_router)
router.include_router(briefings_router)
router.include_router(integrations_router)
