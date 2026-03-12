"""Common response wrapper and error schema."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard API response: { success, data, error }."""

    success: bool = True
    data: T | None = None
    error: str | None = None


class ErrorDetail(BaseModel):
    """Structured error for 4xx/5xx."""

    code: str
    message: str
    details: dict[str, Any] | None = None
