from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

POSTGRES_URL_PREFIXES = ("postgres://", "postgresql://")
PSYCOPG_URL_PREFIX = "postgresql+psycopg://"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./salary.db"
    # NoDecode skips JSON parsing so hosting dashboards can pass a plain comma-separated list.
    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:5173"]

    @field_validator("DATABASE_URL")
    @classmethod
    def use_psycopg_driver_for_postgres(cls, database_url: str) -> str:
        # Providers hand out postgres:// URLs, which SQLAlchemy maps to psycopg2, not psycopg 3.
        for prefix in POSTGRES_URL_PREFIXES:
            if database_url.startswith(prefix):
                return PSYCOPG_URL_PREFIX + database_url.removeprefix(prefix)
        return database_url

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_comma_separated_origins(cls, origins: str | list[str]) -> list[str]:
        if isinstance(origins, list):
            return origins
        return [origin.strip() for origin in origins.split(",") if origin.strip()]


settings = Settings()
