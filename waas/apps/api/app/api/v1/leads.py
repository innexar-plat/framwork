"""Leads API — list and create leads. Requires leads module active for tenant."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import DbSession
from app.core.module_guard import require_active_module
from app.schemas.common import ApiResponse
from app.schemas.lead import LeadCreate, LeadOut
from app.services.lead_service import LeadService

router = APIRouter()

TenantIdLeads = Annotated[str, Depends(require_active_module("leads"))]


def _lead_to_out(lead) -> LeadOut:
    return LeadOut(
        id=lead.id,
        tenant_id=lead.tenant_id,
        name=lead.name,
        email=lead.email,
        source=lead.source,
        message=lead.message,
    )


@router.get("", response_model=ApiResponse[list[LeadOut]])
async def list_leads(
    db: DbSession,
    tenant_id: TenantIdLeads,
    limit: int = 50,
    offset: int = 0,
) -> ApiResponse[list[LeadOut]]:
    """List leads for the current tenant."""
    service = LeadService(db)
    leads = await service.list_leads(tenant_id, limit=limit, offset=offset)
    return ApiResponse(success=True, data=[_lead_to_out(lead) for lead in leads], error=None)


@router.get("/{lead_id}", response_model=ApiResponse[LeadOut])
async def get_lead(
    lead_id: str,
    db: DbSession,
    tenant_id: TenantIdLeads,
) -> ApiResponse[LeadOut]:
    """Get a lead by id."""
    service = LeadService(db)
    lead = await service.get_by_id(lead_id, tenant_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return ApiResponse(success=True, data=_lead_to_out(lead), error=None)


@router.post("", response_model=ApiResponse[LeadOut], status_code=status.HTTP_201_CREATED)
async def create_lead(
    body: LeadCreate,
    db: DbSession,
    tenant_id: TenantIdLeads,
) -> ApiResponse[LeadOut]:
    """Create a lead (form submission)."""
    service = LeadService(db)
    lead = await service.create(tenant_id, body)
    return ApiResponse(success=True, data=_lead_to_out(lead), error=None)
