import pytest

from app.config import Settings


@pytest.mark.parametrize(
    "provider_url",
    ["postgres://user:pw@host:5432/acme", "postgresql://user:pw@host:5432/acme"],
)
def test_settings_database_url_uses_psycopg_driver_for_postgres_url(provider_url: str) -> None:
    # Arrange
    expected_url = "postgresql+psycopg://user:pw@host:5432/acme"

    # Act
    database_url = Settings(_env_file=None, DATABASE_URL=provider_url).DATABASE_URL

    # Assert
    assert database_url == expected_url


def test_settings_database_url_is_unchanged_for_sqlite_url() -> None:
    # Arrange
    sqlite_url = "sqlite:///./salary.db"

    # Act
    database_url = Settings(_env_file=None, DATABASE_URL=sqlite_url).DATABASE_URL

    # Assert
    assert database_url == sqlite_url
