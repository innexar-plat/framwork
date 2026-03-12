"""Schemas for schedule API."""

from datetime import datetime

from pydantic import BaseModel, Field


class ScheduleItemCreate(BaseModel):
    """Create schedule item."""

    title: str = Field(..., min_length=1, max_length=500)
    start_at: datetime = Field(...)
    end_at: datetime = Field(...)
    status: str = Field(default="scheduled", max_length=50)
    contact_name: str | None = Field(None, max_length=255)
    contact_email: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=2000)


class ScheduleItemUpdate(BaseModel):
    """Update schedule item (partial)."""

    title: str | None = Field(None, min_length=1, max_length=500)
    start_at: datetime | None = None
    end_at: datetime | None = None
    status: str | None = Field(None, max_length=50)
    contact_name: str | None = Field(None, max_length=255)
    contact_email: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=2000)


class ScheduleItemOut(BaseModel):
    """Schedule item response."""

    id: str
    tenant_id: str
    title: str
    start_at: datetime
    end_at: datetime
    status: str
    contact_name: str | None
    contact_email: str | None
    notes: str | None
