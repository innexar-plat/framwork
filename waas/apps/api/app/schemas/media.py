"""Schemas for media API."""

from pydantic import BaseModel, Field


class MediaItemCreate(BaseModel):
    """Create media item (metadata after upload)."""

    name: str = Field(..., min_length=1, max_length=500)
    storage_key: str = Field(..., min_length=1, max_length=500)
    mime_type: str | None = Field(None, max_length=100)
    size_bytes: int | None = None


class MediaItemOut(BaseModel):
    """Media item response."""

    id: str
    tenant_id: str
    name: str
    storage_key: str
    mime_type: str | None
    size_bytes: int | None
