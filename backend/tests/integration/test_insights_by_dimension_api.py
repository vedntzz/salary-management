from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.currency import CURRENCY_BY_COUNTRY
from tests.insight_expectations import Rows, expected_group_stats, group_salaries

STAT_FIELDS = ("count", "min", "max", "avg", "median")


def read_by_dimension(api_client: TestClient, **params: str) -> dict[str, Any]:
    response = api_client.get("/api/insights/by-dimension", params=params)
    assert response.status_code == 200
    return response.json()


def stats_by_group(body: dict[str, Any]) -> dict[str, dict[str, int]]:
    return {row["group"]: {field: row[field] for field in STAT_FIELDS} for row in body["rows"]}


@pytest.mark.parametrize("dimension", ["country", "department", "job_title"])
def test_by_dimension_returns_usd_stats_per_group(
    api_client: TestClient, seeded_employees: Rows, dimension: str
) -> None:
    # Arrange
    groups = group_salaries(seeded_employees, dimension, in_usd=True)
    expected = {group: expected_group_stats(salaries) for group, salaries in groups.items()}

    # Act
    body = read_by_dimension(api_client, dimension=dimension, currency="usd")

    # Assert
    assert stats_by_group(body) == expected


def test_by_dimension_returns_rows_sorted_by_group(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    expected_order = sorted({row["department"] for row in seeded_employees})

    # Act
    body = read_by_dimension(api_client, dimension="department", currency="usd")

    # Assert
    assert [row["group"] for row in body["rows"]] == expected_order


def test_by_dimension_defaults_to_usd(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    groups = group_salaries(seeded_employees, "department", in_usd=True)
    expected = {group: expected_group_stats(salaries) for group, salaries in groups.items()}

    # Act
    body = read_by_dimension(api_client, dimension="department")

    # Assert
    assert stats_by_group(body) == expected


def test_by_dimension_returns_local_stats_per_country(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    groups = group_salaries(seeded_employees, "country", in_usd=False)
    expected = {group: expected_group_stats(salaries) for group, salaries in groups.items()}

    # Act
    body = read_by_dimension(api_client, dimension="country", currency="local")

    # Assert
    assert stats_by_group(body) == expected


def test_by_dimension_labels_each_local_row_with_its_currency(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    countries = {row["country"] for row in seeded_employees}
    expected = {country: CURRENCY_BY_COUNTRY[country] for country in countries}

    # Act
    body = read_by_dimension(api_client, dimension="country", currency="local")

    # Assert
    assert {row["group"]: row["currency"] for row in body["rows"]} == expected


def test_by_dimension_labels_usd_rows_with_usd(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"dimension": "department", "currency": "usd"}

    # Act
    body = read_by_dimension(api_client, **params)

    # Assert
    assert {row["currency"] for row in body["rows"]} == {"USD"}


@pytest.mark.parametrize("dimension", ["department", "job_title"])
def test_by_dimension_rejects_local_currency_outside_country(
    api_client: TestClient, seeded_employees: Rows, dimension: str
) -> None:
    # Arrange
    params = {"dimension": dimension, "currency": "local"}

    # Act
    response = api_client.get("/api/insights/by-dimension", params=params)

    # Assert
    assert response.status_code == 422
    assert "detail" in response.json()


def test_by_dimension_rejects_unknown_dimension(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"dimension": "hire_date", "currency": "usd"}

    # Act
    response = api_client.get("/api/insights/by-dimension", params=params)

    # Assert
    assert response.status_code == 422
