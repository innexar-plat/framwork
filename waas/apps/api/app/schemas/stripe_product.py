"""Schemas for Stripe products API (read-only list)."""

from datetime import datetime

from pydantic import BaseModel


class StripeProductResponse(BaseModel):
    """Stripe product response."""

    id: str
    tenant_id: str
    stripe_product_id: str
    stripe_price_id: str
    name: str
    amount_cents: int
    currency: str
    interval: str
    created_at: datetime
    updated_at: datetime
