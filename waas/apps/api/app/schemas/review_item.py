"""Schemas for reviews API."""

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Create review."""

    author_name: str = Field(..., min_length=1, max_length=200)
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=1)
    author_photo: str | None = Field(None, max_length=500)
    source: str = Field(default="manual", pattern="^(manual|google)$")


class ReviewUpdate(BaseModel):
    """Update review (partial)."""

    author_name: str | None = Field(None, min_length=1, max_length=200)
    rating: int | None = Field(None, ge=1, le=5)
    text: str | None = Field(None, min_length=1)
    author_photo: str | None = Field(None, max_length=500)
    is_published: bool | None = None
    sort_order: int | None = None


class ReviewResponse(BaseModel):
    """Review response."""

    id: str
    tenant_id: str
    author_name: str
    author_photo: str | None
    rating: int
    text: str
    source: str
    google_review_id: str | None
    is_published: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ReviewReorder(BaseModel):
    """Reorder reviews by id list."""

    ids: list[str] = Field(..., min_length=0)
