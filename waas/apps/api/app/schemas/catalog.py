"""Schemas for catalog API (plans, niches, modules)."""

from pydantic import BaseModel, Field


class PlanOut(BaseModel):
    """Plan response."""

    id: str
    code: str
    name: str
    description: str | None = None
    sort_order: int = 0
    is_active: bool = True


class NicheOut(BaseModel):
    """Niche response."""

    id: str
    code: str
    name: str
    parent_id: str | None = None
    sort_order: int = 0
    is_active: bool = True


class ModuleOut(BaseModel):
    """Module response."""

    id: str
    code: str
    name: str
    description: str | None = None
    is_active: bool = True


class PlanCreate(BaseModel):
    """Create plan (admin)."""

    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=500)
    sort_order: int = 0
    is_active: bool = True


class PlanUpdate(BaseModel):
    """Update plan (admin, partial)."""

    code: str | None = Field(None, max_length=50)
    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=500)
    sort_order: int | None = None
    is_active: bool | None = None


class NicheCreate(BaseModel):
    """Create niche (admin)."""

    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: str | None = None
    sort_order: int = 0
    is_active: bool = True


class NicheUpdate(BaseModel):
    """Update niche (admin, partial)."""

    code: str | None = Field(None, max_length=50)
    name: str | None = Field(None, max_length=255)
    parent_id: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class ModuleCreate(BaseModel):
    """Create module (admin)."""

    code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=500)
    is_active: bool = True


class ModuleUpdate(BaseModel):
    """Update module (admin, partial)."""

    code: str | None = Field(None, max_length=50)
    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class MatrixRowOut(BaseModel):
    """Plan×Niche×Module row (admin)."""

    id: str
    plan_id: str
    niche_id: str
    module_id: str
    is_enabled: bool


class MatrixRowCreate(BaseModel):
    """Enable module for plan+niche (admin)."""

    plan_id: str = Field(..., min_length=1)
    niche_id: str = Field(..., min_length=1)
    module_id: str = Field(..., min_length=1)
    is_enabled: bool = True
