"""Payments API — list Stripe products. Requires stripe_payments module active."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.repositories.stripe_product_repository import StripeProductRepository
from app.schemas.common import ApiResponse
from app.schemas.stripe_product import StripeProductResponse

router = APIRouter()

TenantIdPayments = Annotated[str, Depends(require_active_module("stripe_payments"))]


def _to_response(item) -> StripeProductResponse:
    return StripeProductResponse(
        id=item.id,
        tenant_id=item.tenant_id,
        stripe_product_id=item.stripe_product_id,
        stripe_price_id=item.stripe_price_id,
        name=item.name,
        amount_cents=item.amount_cents,
        currency=item.currency,
        interval=item.interval,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("/products", response_model=ApiResponse[list[StripeProductResponse]])
async def list_products(
    db: DbSession,
    tenant_id: TenantIdPayments,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[StripeProductResponse]]:
    """List Stripe products for the tenant (read-only)."""
    repo = StripeProductRepository(db)
    items = await repo.list_by_tenant(tenant_id, limit=limit, offset=offset)
    return ApiResponse(success=True, data=[_to_response(i) for i in items], error=None)
