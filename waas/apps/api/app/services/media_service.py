"""Media service — create and list media items scoped by tenant."""

import re
from pathlib import Path
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import MediaItem
from app.repositories.media_repository import MediaRepository
from app.schemas.media import MediaItemCreate

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"}
SAFE_FILENAME = re.compile(r"^[a-zA-Z0-9._-]+$")


class MediaService:
    """Business logic for media items. All operations require tenant_id."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = MediaRepository(db)

    async def list_items(
        self,
        tenant_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[MediaItem]:
        return await self._repo.list_by_tenant(tenant_id, limit=limit, offset=offset)

    async def get_by_id(self, item_id: str, tenant_id: str) -> MediaItem | None:
        return await self._repo.get_by_id(item_id, tenant_id)

    async def create(self, tenant_id: str, body: MediaItemCreate) -> MediaItem:
        item = MediaItem(
            id=uuid4().hex,
            tenant_id=tenant_id,
            name=body.name,
            storage_key=body.storage_key,
            mime_type=body.mime_type,
            size_bytes=body.size_bytes,
        )
        return await self._repo.add(item)

    async def delete(self, item_id: str, tenant_id: str) -> bool:
        item = await self._repo.get_by_id(item_id, tenant_id)
        if not item:
            return False
        await self._repo.delete(item)
        return True

    def _safe_suffix(self, filename: str) -> str:
        """Return lowercase suffix if allowed, else .bin."""
        suf = Path(filename).suffix.lower()
        return suf if suf in ALLOWED_EXTENSIONS else ".bin"

    async def upload_file(
        self,
        tenant_id: str,
        file_content: bytes,
        filename: str,
        mime_type: str | None = None,
    ) -> MediaItem:
        """Save file to disk and create MediaItem. Validates size and filename."""
        settings = get_settings()
        if len(file_content) > settings.media_max_size_bytes:
            raise ValueError("File too large")
        if not filename or not SAFE_FILENAME.match(filename):
            raise ValueError("Invalid filename")
        suffix = self._safe_suffix(filename)
        storage_key = f"{tenant_id}/{uuid4().hex}{suffix}"
        base = Path(settings.media_upload_dir).resolve()
        target_dir = base / tenant_id
        target_dir.mkdir(parents=True, exist_ok=True)
        target = base / storage_key
        target.write_bytes(file_content)
        name = Path(filename).name[:500]
        item = MediaItem(
            id=uuid4().hex,
            tenant_id=tenant_id,
            name=name,
            storage_key=storage_key,
            mime_type=mime_type or "application/octet-stream",
            size_bytes=len(file_content),
        )
        return await self._repo.add(item)
