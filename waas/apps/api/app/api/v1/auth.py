"""Auth endpoints: login, refresh, me. Rate limited to reduce brute-force risk."""

from fastapi import APIRouter, HTTPException, Request, status

from app.core.deps import CurrentUserId, DbSession, RoleFromToken, TenantIdFromToken
from app.core.i18n import Locale, translate
from app.core.rate_limit import limiter
from app.repositories.tenant_repository import TenantRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    LoginRequest,
    MeResponse,
    MeTenant,
    MeUser,
    RefreshRequest,
    TokenResponse,
)
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService
from app.services.catalog_service import CatalogService

router = APIRouter()

AUTH_LIMIT = "15/minute"


@router.post("/login", response_model=ApiResponse[TokenResponse])
@limiter.limit(AUTH_LIMIT)
async def login(
    request: Request,
    body: LoginRequest,
    db: DbSession,
    locale: Locale,
) -> ApiResponse[TokenResponse]:
    """Login with email/password. Returns JWT access and refresh tokens."""
    service = AuthService(db)
    result = await service.login(body)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("auth.invalid_credentials", locale),
        )
    access_token, refresh_token, _tenant_id, _role = result
    return ApiResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        ),
        error=None,
    )


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
@limiter.limit(AUTH_LIMIT)
async def refresh(
    request: Request,
    body: RefreshRequest,
    db: DbSession,
    locale: Locale,
) -> ApiResponse[TokenResponse]:
    """Exchange refresh token for new access and refresh tokens."""
    service = AuthService(db)
    result = await service.refresh_tokens(body.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=translate("auth.invalid_refresh_token", locale),
        )
    access_token, new_refresh_token = result
    return ApiResponse(
        success=True,
        data=TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
        ),
        error=None,
    )


@router.get("/me", response_model=ApiResponse[MeResponse])
async def me(
    user_id: CurrentUserId,
    tenant_id: TenantIdFromToken,
    role: RoleFromToken,
    db: DbSession,
) -> ApiResponse[MeResponse]:
    """Return current user, tenant (if any), role, global_role, and enabled modules."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    me_user = MeUser(id=user.id, email=user.email, name=user.name)
    global_role = getattr(user, "global_role", None)

    me_tenant: MeTenant | None = None
    enabled_modules: list[str] = []
    if tenant_id:
        tenant_repo = TenantRepository(db)
        tenant = await tenant_repo.get_by_id(tenant_id)
        if tenant:
            me_tenant = MeTenant(
                id=tenant.id,
                name=tenant.name,
                slug=tenant.slug,
                plan_id=tenant.plan_id,
                niche_id=tenant.niche_id,
            )
            catalog = CatalogService(db)
            enabled_modules = await catalog.get_active_module_codes_for_tenant(tenant_id)

    return ApiResponse(
        success=True,
        data=MeResponse(
            user=me_user,
            tenant=me_tenant,
            role=role,
            global_role=global_role,
            enabled_modules=enabled_modules,
        ),
        error=None,
    )
