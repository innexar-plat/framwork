"""Tests for module guard (require_active_module, get_required_tenant_id)."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.core.module_guard import get_required_tenant_id, require_active_module


def test_get_required_tenant_id_raises_when_none() -> None:
    with pytest.raises(HTTPException) as exc_info:
        get_required_tenant_id(locale="en", tenant_id=None)
    assert exc_info.value.status_code == 403


def test_get_required_tenant_id_returns_tenant_id() -> None:
    result = get_required_tenant_id(locale="en", tenant_id="tid-1")
    assert result == "tid-1"


@pytest.mark.asyncio
async def test_require_active_module_raises_when_module_not_in_list() -> None:
    dep = require_active_module("blog")
    with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
        mock_catalog = MagicMock()
        mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["leads"])
        mock_catalog_cls.return_value = mock_catalog
        with pytest.raises(HTTPException) as exc_info:
            await dep(tenant_id="tid-1", db=MagicMock(), locale="en")
    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_require_active_module_returns_tenant_id_when_enabled() -> None:
    dep = require_active_module("blog")
    with patch("app.core.module_guard.CatalogService") as mock_catalog_cls:
        mock_catalog = MagicMock()
        mock_catalog.get_active_module_codes_for_tenant = AsyncMock(return_value=["blog", "leads"])
        mock_catalog_cls.return_value = mock_catalog
        result = await dep(tenant_id="tid-1", db=MagicMock(), locale="en")
    assert result == "tid-1"
