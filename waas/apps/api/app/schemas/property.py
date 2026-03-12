"""Schemas for property API."""

from pydantic import BaseModel, Field


class PropertyItemCreate(BaseModel):
    """Create property item."""

    title: str = Field(..., min_length=1, max_length=500)
    address: str | None = Field(None, max_length=500)
    status: str = Field(default="draft", max_length=50)


class PropertyItemOut(BaseModel):
    """Property item response."""

    id: str
    tenant_id: str
    title: str
    address: str | None
    status: str
