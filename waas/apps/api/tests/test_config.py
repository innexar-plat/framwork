"""Tests for app.config.settings."""

from app.config import get_settings
from app.config.settings import Settings


def test_get_settings_returns_settings() -> None:
    settings = get_settings()
    assert settings.app_name == "WaaS API"
    assert settings.jwt_algorithm == "HS256"
    assert isinstance(settings.get_cors_origins_list(), list)


def test_get_settings_cached() -> None:
    a = get_settings()
    b = get_settings()
    assert a is b


def test_is_production_when_not_debug() -> None:
    settings = get_settings()
    if not settings.debug:
        assert settings.is_production is True
    else:
        assert settings.is_production is False


def test_cors_origins_parsed_from_comma_separated_string() -> None:
    """CORS_ORIGINS env as comma-separated string becomes list via get_cors_origins_list()."""
    settings = Settings(cors_origins="http://localhost:3000,http://admin:3000")
    assert settings.get_cors_origins_list() == ["http://localhost:3000", "http://admin:3000"]
    settings2 = Settings(cors_origins="  a  , b ")
    assert settings2.get_cors_origins_list() == ["a", "b"]
