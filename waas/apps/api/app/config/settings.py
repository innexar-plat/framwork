"""Application settings from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration. All secrets from env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "WaaS API"
    debug: bool = False
    log_level: str = "INFO"

    # Database
    database_url: str = "postgresql+asyncpg://waas:waas@localhost:5432/waas"

    # JWT (auth)
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # API keys (integration)
    api_key_header: str = "X-Api-Key"
    api_secret_header: str = "X-Api-Secret"

    # CORS (env CORS_ORIGINS: comma-separated string)
    cors_origins: str = "http://localhost:3000"

    # Media upload (local storage base path)
    media_upload_dir: str = "./uploads"
    media_max_size_bytes: int = 10 * 1024 * 1024  # 10 MB

    # Tenant integrations (Fernet key for encrypting config_encrypted)
    encryption_key: str = ""

    # Cloudflare DNS
    cf_zone_id: str = ""
    cf_api_token: str = ""
    cf_base_domain: str = "waasfl.com"
    cf_cname_target: str = ""

    # GitHub (template fork)
    git_token: str = ""
    git_template_owner: str = ""
    git_template_repo: str = "waas-site-template"

    # SMTP / Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_pass: str = ""
    smtp_from: str = "noreply@waasfl.com"
    operator_email: str = ""

    # Panel / Site URLs
    panel_base_url: str = "https://app.waasfl.com"
    site_base_domain: str = "waasfl.com"

    def get_cors_origins_list(self) -> list[str]:
        """CORS origins as list (split by comma). Use this for FastAPI allow_origins."""
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()] or [
            "http://localhost:3000"
        ]

    @property
    def is_production(self) -> bool:
        return not self.debug


@lru_cache
def get_settings() -> Settings:
    return Settings()
