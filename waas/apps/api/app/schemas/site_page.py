"""Schemas for site pages API."""

from pydantic import BaseModel, Field


class SitePageCreate(BaseModel):
    """Create site page."""

    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=500)
    content: str | None = Field(None, max_length=50_000)
    status: str = Field(default="draft", max_length=50)
    sort_order: int = Field(default=0, ge=0)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class SitePageUpdate(BaseModel):
    """Update site page (partial)."""

    title: str | None = Field(None, min_length=1, max_length=500)
    slug: str | None = Field(None, min_length=1, max_length=500)
    content: str | None = Field(None, max_length=50_000)
    status: str | None = Field(None, max_length=50)
    sort_order: int | None = Field(None, ge=0)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class SitePageOut(BaseModel):
    """Site page response."""

    id: str
    tenant_id: str
    title: str
    slug: str
    content: str | None
    status: str
    sort_order: int
    meta_title: str | None = None
    meta_description: str | None = None
