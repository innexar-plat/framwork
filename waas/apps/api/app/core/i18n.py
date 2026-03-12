"""i18n: locale resolution and translation for API messages (en, pt, es)."""

import json
import logging
from pathlib import Path
from typing import Annotated, Any

from fastapi import Depends, Header

logger = logging.getLogger(__name__)

SUPPORTED_LOCALES = ("en", "pt", "es")
DEFAULT_LOCALE = "en"

_LOCALES_DIR = Path(__file__).resolve().parent.parent / "locales"
_MESSAGES: dict[str, dict[str, Any]] = {}


def _load_messages() -> None:
    """Load locale JSON files into _MESSAGES."""
    if _MESSAGES:
        return
    for code in SUPPORTED_LOCALES:
        path = _LOCALES_DIR / f"{code}.json"
        try:
            _MESSAGES[code] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as e:
            logger.warning("Failed to load locale %s: %s", code, e)
            _MESSAGES[code] = {}


def get_locale(accept_language: str | None = None) -> str:
    """Parse Accept-Language and return first supported locale or default."""
    if not accept_language:
        return DEFAULT_LOCALE
    for part in accept_language.replace(" ", "").split(","):
        lang = part.split(";")[0].split("-")[0].lower()
        if lang in SUPPORTED_LOCALES:
            return lang
    return DEFAULT_LOCALE


def _get_nested(data: dict[str, Any], key_path: str) -> str | None:
    """Get nested value by dot-separated key. Returns None if not found."""
    value: Any = data
    for part in key_path.split("."):
        value = value.get(part) if isinstance(value, dict) else None
        if value is None:
            return None
    return str(value) if isinstance(value, str) else None


def translate(key: str, locale: str | None = None) -> str:
    """Return message for key in locale (e.g. 'auth.invalid_credentials'). Fallback: en."""
    _load_messages()
    loc = locale if locale in SUPPORTED_LOCALES else DEFAULT_LOCALE
    for messages in (_MESSAGES.get(loc), _MESSAGES.get(DEFAULT_LOCALE)):
        if not messages:
            continue
        result = _get_nested(messages, key)
        if result:
            return result
    return key


def get_locale_from_header(
    accept_language: Annotated[str | None, Header(alias="Accept-Language")] = None,
) -> str:
    """FastAPI dependency: resolve locale from Accept-Language header."""
    return get_locale(accept_language)


Locale = Annotated[str, Depends(get_locale_from_header)]
