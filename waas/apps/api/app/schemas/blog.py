"""Schemas for blog API."""

from pydantic import BaseModel, Field


class BlogPostCreate(BaseModel):
    """Create blog post."""

    title: str = Field(..., min_length=1, max_length=500)
    slug: str = Field(..., min_length=1, max_length=500)
    content: str | None = Field(None, max_length=50_000)
    status: str = Field(default="draft", max_length=50)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class BlogPostUpdate(BaseModel):
    """Update blog post (partial)."""

    title: str | None = Field(None, min_length=1, max_length=500)
    slug: str | None = Field(None, min_length=1, max_length=500)
    content: str | None = Field(None, max_length=50_000)
    status: str | None = Field(None, max_length=50)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)


class BlogPostOut(BaseModel):
    """Blog post response."""

    id: str
    tenant_id: str
    title: str
    slug: str
    content: str | None
    status: str
    meta_title: str | None = None
    meta_description: str | None = None
