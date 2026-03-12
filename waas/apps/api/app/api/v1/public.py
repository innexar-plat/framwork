"""Public API — no auth. For onboarding and slug check."""

from fastapi import APIRouter

from app.core.deps import DbSession
from app.repositories.briefing_repository import BriefingRepository
from app.repositories.tenant_repository import TenantRepository
from app.schemas.common import ApiResponse

router = APIRouter()


def _normalize_slug(slug: str) -> str:
    """Lowercase, strip, replace spaces with hyphen."""
    return (slug or "").strip().lower().replace(" ", "-")


@router.get("/check-slug/{slug}", response_model=ApiResponse[dict])
async def check_slug_availability(
    slug: str,
    db: DbSession,
) -> ApiResponse[dict]:
    """
    Check if subdomain/slug is available for new briefing.
    Returns { "available": true } if no tenant and no pending/provisioning briefing uses it.
    """
    normalized = _normalize_slug(slug)
    if not normalized:
        return ApiResponse(success=True, data={"available": False}, error=None)
    tenant_repo = TenantRepository(db)
    briefing_repo = BriefingRepository(db)
    taken = await tenant_repo.slug_or_subdomain_taken(normalized)
    if taken:
        return ApiResponse(success=True, data={"available": False}, error=None)
    requested = await briefing_repo.slug_requested_exists(normalized)
    return ApiResponse(
        success=True,
        data={"available": not requested},
        error=None,
    )
