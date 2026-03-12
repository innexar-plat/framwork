"""Tests for app.core.i18n (locale and translation)."""

from app.core.i18n import (
    DEFAULT_LOCALE,
    SUPPORTED_LOCALES,
    get_locale,
    translate,
)


def test_supported_locales() -> None:
    assert "en" in SUPPORTED_LOCALES
    assert "pt" in SUPPORTED_LOCALES
    assert "es" in SUPPORTED_LOCALES
    assert DEFAULT_LOCALE == "en"


def test_get_locale_empty_returns_default() -> None:
    assert get_locale(None) == "en"
    assert get_locale("") == "en"


def test_get_locale_accept_language_en() -> None:
    assert get_locale("en") == "en"
    assert get_locale("en-US,en;q=0.9") == "en"


def test_get_locale_accept_language_pt() -> None:
    assert get_locale("pt") == "pt"
    assert get_locale("pt-BR,pt;q=0.9") == "pt"


def test_get_locale_accept_language_es() -> None:
    assert get_locale("es") == "es"
    assert get_locale("es-ES,es;q=0.9") == "es"


def test_get_locale_unsupported_returns_default() -> None:
    assert get_locale("fr") == "en"
    assert get_locale("zh-CN") == "en"


def test_translate_en() -> None:
    assert translate("auth.invalid_credentials", "en") == "Invalid email or password"
    assert translate("integration.workspace_not_found", "en") == "Workspace not found"


def test_translate_pt() -> None:
    assert "inválidos" in translate("auth.invalid_credentials", "pt")
    assert "não encontrado" in translate("integration.workspace_not_found", "pt")


def test_translate_es() -> None:
    assert "no válidos" in translate("auth.invalid_credentials", "es")
    assert "no encontrado" in translate("integration.workspace_not_found", "es")


def test_translate_unknown_key_returns_key() -> None:
    assert translate("unknown.key", "en") == "unknown.key"


def test_translate_fallback_to_en() -> None:
    """Invalid locale falls back to default (en)."""
    result = translate("auth.invalid_credentials", "xx")
    assert "Invalid" in result or "email" in result.lower()
