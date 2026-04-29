"""
Configuration management using Pydantic Settings
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    database_url: str = "postgresql://user:password@localhost:5432/foodstore"

    # Security
    secret_key: str = "changeme-secret-key-minimum-64-characters-long"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173"]

    # MercadoPago
    mp_access_token: str = ""
    mp_public_key: str = ""

    # Admin
    admin_email: str = "admin@foodstore.com"
    admin_password: str = "admin123"

    # Rate limiting
    rate_limit_login: int = 5  # attempts
    rate_limit_window: int = 15  # minutes

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()