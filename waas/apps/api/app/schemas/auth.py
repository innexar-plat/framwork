"""Auth request/response schemas."""

from pydantic import BaseModel, EmailStr


class MeUser(BaseModel):
    id: str
    email: str
    name: str | None


class MeTenant(BaseModel):
    id: str
    name: str
    slug: str
    plan_id: str | None
    niche_id: str | None


class MeResponse(BaseModel):
    user: MeUser
    tenant: MeTenant | None
    role: str | None
    global_role: str | None
    enabled_modules: list[str]


class LoginRequest(BaseModel):
    """Login body."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Refresh token body."""

    refresh_token: str
