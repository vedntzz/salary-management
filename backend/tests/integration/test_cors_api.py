import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app

LISTED_ORIGINS = ["https://acme-salaries.vercel.app", "http://localhost:5173"]


def send_preflight(client: TestClient, origin: str) -> dict[str, str]:
    headers = {"Origin": origin, "Access-Control-Request-Method": "GET"}
    return dict(client.options("/api/employees", headers=headers).headers)


@pytest.fixture
def cors_client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Hosting dashboards set env vars as plain text, so the list arrives comma-separated.
    monkeypatch.setenv("CORS_ORIGINS", ",".join(LISTED_ORIGINS))
    return TestClient(create_app(Settings(_env_file=None)))


@pytest.mark.parametrize("origin", LISTED_ORIGINS)
def test_cors_preflight_allows_origin_when_listed_in_env(
    cors_client: TestClient, origin: str
) -> None:
    # Arrange
    requested_origin = origin

    # Act
    headers = send_preflight(cors_client, requested_origin)

    # Assert
    assert headers.get("access-control-allow-origin") == requested_origin


def test_cors_preflight_omits_allow_origin_when_origin_not_listed(
    cors_client: TestClient,
) -> None:
    # Arrange
    unlisted_origin = "https://evil.example.com"

    # Act
    headers = send_preflight(cors_client, unlisted_origin)

    # Assert
    assert "access-control-allow-origin" not in headers
