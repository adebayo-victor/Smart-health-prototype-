"""
Configuration management for SmartHealth backend.
Loads settings from .env and formats the SQLAlchemy connection URL.
"""
import os
from pathlib import Path

# Attempt to load using pydantic-settings if available; otherwise use python-dotenv or built-in file loader
try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    from pydantic import Field

    class Settings(BaseSettings):
        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore",
        )
        DB_URL: str = Field(default="smarthealth_local", alias="DB_URL")

        @property
        def sqlalchemy_database_url(self) -> str:
            raw_url = (self.DB_URL or "").strip()
            if not raw_url:
                return "sqlite:///smarthealth_local.db"
            if raw_url.startswith("sqlite://") or raw_url.startswith("postgresql://") or raw_url.startswith("postgres://"):
                return raw_url
            
            # Format bare name (e.g., "smarthealth_local") as SQLite local database file
            clean_name = raw_url.replace(".db", "")
            return f"sqlite:///{clean_name}.db"

    settings = Settings()

except ImportError:
    # Fallback to python-dotenv or lightweight .env parser
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        env_file = Path(".env")
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        v = v.strip().strip('"').strip("'")
                        os.environ.setdefault(k.strip(), v)

    class FallbackSettings:
        def __init__(self) -> None:
            self.DB_URL: str = os.getenv("DB_URL", "smarthealth_local")

        @property
        def sqlalchemy_database_url(self) -> str:
            raw_url = (self.DB_URL or "").strip()
            if not raw_url:
                return "sqlite:///smarthealth_local.db"
            if raw_url.startswith("sqlite://") or raw_url.startswith("postgresql://") or raw_url.startswith("postgres://"):
                return raw_url
            
            clean_name = raw_url.replace(".db", "")
            return f"sqlite:///{clean_name}.db"

    settings = FallbackSettings()  # type: ignore[assignment]
