"""Catalog admin: require super_admin or catalog_admin global role."""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.deps import CurrentUserId, DbSession, Locale
from app.core.i18n import translate
from app.repositories.user_repository import UserRepository

CATALOG_ADMIN_ROLES = ("super_admin", "catalog_admin")


async def require_catalog_admin(
    user_id: CurrentUserId,
    db: DbSession,
    locale: Locale,
) -> str:
    """Require user to have global_role in (super_admin, catalog_admin). Return user_id."""
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if (
        not user
        or not getattr(user, "global_role", None)
        or user.global_role not in CATALOG_ADMIN_ROLES
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=translate("catalog_admin.forbidden", locale),
        )
    return user_id


CatalogAdminUserId = Annotated[str, Depends(require_catalog_admin)]
