from typing import Any, get_args

from fastapi.testclient import TestClient

from app.currency import CURRENCY_BY_COUNTRY
from app.schemas.employee import Country

FILTER_KEYS = ("countries", "departments", "job_titles")


def test_meta_filters_returns_distinct_sorted_filter_values(
    api_client: TestClient, seeded_employees: list[dict[str, Any]]
) -> None:
    # Arrange
    expected = {
        "countries": sorted({row["country"] for row in seeded_employees}),
        "departments": sorted({row["department"] for row in seeded_employees}),
        "job_titles": sorted({row["job_title"] for row in seeded_employees}),
    }

    # Act
    response = api_client.get("/api/meta/filters")

    # Assert
    assert response.status_code == 200
    assert {key: response.json()[key] for key in FILTER_KEYS} == expected


def test_meta_filters_includes_currency_for_every_supported_country(
    api_client: TestClient, seeded_employees: list[dict[str, Any]]
) -> None:
    # Arrange
    supported_countries = set(get_args(Country))

    # Act
    response = api_client.get("/api/meta/filters")

    # Assert
    currency_by_country = response.json()["currency_by_country"]
    assert currency_by_country == CURRENCY_BY_COUNTRY
    assert set(currency_by_country) == supported_countries


def test_meta_filters_includes_currencies_when_no_employees_exist(api_client: TestClient) -> None:
    # Arrange: no employees seeded

    # Act
    response = api_client.get("/api/meta/filters")

    # Assert
    assert response.status_code == 200
    assert response.json()["currency_by_country"] == CURRENCY_BY_COUNTRY
