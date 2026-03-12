"""Schemas for leads API."""

from pydantic import BaseModel, EmailStr, Field


class LeadCreate(BaseModel):
    """Create lead."""

    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    source: str | None = Field(None, max_length=100)
    message: str | None = Field(None, max_length=2000)


class LeadOut(BaseModel):
    """Lead response."""

    id: str
    tenant_id: str
    name: str
    email: str
    source: str | None
    message: str | None
