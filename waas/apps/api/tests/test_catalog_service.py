"""Tests for CatalogService."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.catalog_service import CatalogService


@pytest.fixture
def db_session():
    return MagicMock()


@pytest.mark.asyncio
async def test_get_plan_id_by_code_returns_id(db_session) -> None:
    with patch("app.services.catalog_service.PlanRepository") as mock_repo_cls:
        mock_repo = MagicMock()
        plan = MagicMock()
        plan.id = "plan-1"
        mock_repo.get_by_code = AsyncMock(return_value=plan)
        mock_repo_cls.return_value = mock_repo
        svc = CatalogService(db_session)
        result = await svc.get_plan_id_by_code("starter")
    assert result == "plan-1"


@pytest.mark.asyncio
async def test_get_plan_id_by_code_returns_none_when_not_found(db_session) -> None:
    with patch("app.services.catalog_service.PlanRepository") as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.get_by_code = AsyncMock(return_value=None)
        mock_repo_cls.return_value = mock_repo
        svc = CatalogService(db_session)
        result = await svc.get_plan_id_by_code("unknown")
    assert result is None


@pytest.mark.asyncio
async def test_get_active_module_codes_for_tenant_empty_when_no_plan(db_session) -> None:
    tenant = MagicMock()
    tenant.id = "t1"
    tenant.plan_id = None
    tenant.niche_id = None
    with patch("app.services.catalog_service.TenantRepository") as tr:
        with patch("app.services.catalog_service.PlanNicheModuleRepository"):
            with patch("app.services.catalog_service.PlanRepository"):
                with patch("app.services.catalog_service.NicheRepository"):
                    with patch("app.services.catalog_service.ModuleRepository"):
                        tr.return_value.get_by_id = AsyncMock(return_value=tenant)
                        svc = CatalogService(db_session)
                        result = await svc.get_active_module_codes_for_tenant("t1")
    assert result == []


@pytest.mark.asyncio
async def test_get_active_module_codes_for_tenant_returns_codes(db_session) -> None:
    tenant = MagicMock()
    tenant.id = "t1"
    tenant.plan_id = "p1"
    tenant.niche_id = "n1"
    with patch("app.services.catalog_service.TenantRepository") as tr:
        with patch("app.services.catalog_service.PlanNicheModuleRepository") as pnm:
            with patch("app.services.catalog_service.PlanRepository"):
                with patch("app.services.catalog_service.NicheRepository"):
                    with patch("app.services.catalog_service.ModuleRepository"):
                        tr.return_value.get_by_id = AsyncMock(return_value=tenant)
                        pnm.return_value.get_active_module_codes = AsyncMock(
                            return_value=["blog", "leads"]
                        )
                        svc = CatalogService(db_session)
                        result = await svc.get_active_module_codes_for_tenant("t1")
    assert result == ["blog", "leads"]
