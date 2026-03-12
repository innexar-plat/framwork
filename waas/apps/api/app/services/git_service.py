"""GitHub service — fork template repo for new tenant site."""

import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class GitService:
    """Fork template repository via GitHub API."""

    def __init__(self) -> None:
        self._settings = get_settings()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self._settings.git_token}",
            "Accept": "application/vnd.github+json",
        }

    async def create_site_repo(self, tenant_id: str, slug: str) -> str:
        """
        Fork template repo; optional name = waas-site-{slug}.
        Returns clone_url of the new repo.
        """
        owner = self._settings.git_template_owner
        repo = self._settings.git_template_repo
        name = f"waas-site-{slug}"
        url = f"https://api.github.com/repos/{owner}/{repo}/forks"
        payload = {"name": name, "default_branch_only": True}
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=self._headers())
            resp.raise_for_status()
        data = resp.json()
        clone_url = data.get("clone_url") or data.get("html_url")
        if not clone_url:
            raise RuntimeError("GitHub fork response missing clone_url")
        return clone_url
