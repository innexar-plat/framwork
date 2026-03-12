"""Cloudflare DNS service — create/delete CNAME for tenant subdomains."""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class CloudflareService:
    """Create and delete subdomain CNAME records via Cloudflare API v4."""

    def __init__(self) -> None:
        self._settings = get_settings()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._settings.cf_api_token}",
            "Content-Type": "application/json",
        }

    async def create_subdomain(self, slug: str) -> str:
        """
        Create CNAME record: {slug}.{cf_base_domain} -> cf_cname_target.
        Returns the record id (cf_record_id) for later delete.
        """
        zone_id = self._settings.cf_zone_id
        base = self._settings.cf_base_domain
        target = self._settings.cf_cname_target
        name = f"{slug}.{base}"
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"
        payload = {
            "type": "CNAME",
            "name": name,
            "content": target,
            "ttl": 1,
            "proxied": True,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=self._headers())
            resp.raise_for_status()
        data = resp.json()
        if not data.get("success") or not data.get("result", {}).get("id"):
            raise RuntimeError(
                data.get("errors", [{"message": "Unknown error"}])[0].get(
                    "message", "Create DNS record failed"
                )
            )
        return data["result"]["id"]

    async def delete_subdomain(self, record_id: str) -> bool:
        """Delete DNS record by id. Returns True on success."""
        zone_id = self._settings.cf_zone_id
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.delete(url, headers=self._headers())
            if resp.status_code == 404:
                return True
            resp.raise_for_status()
        return resp.json().get("success", False)

    async def test_connection(self) -> bool:
        """Verify zone and token by GET zone. Returns True if OK."""
        zone_id = self._settings.cf_zone_id
        if not zone_id or not self._settings.cf_api_token:
            return False
        url = f"https://api.cloudflare.com/client/v4/zones/{zone_id}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=self._headers())
            if resp.status_code != 200:
                return False
            data = resp.json()
            return data.get("success", False)
