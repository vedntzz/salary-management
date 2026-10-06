from typing import Any

from fastapi.testclient import TestClient

from app.currency import CURRENCY_BY_COUNTRY
from tests.insight_expectations import Rows, expected_usd_salary


def read_distribution(api_client: TestClient, **params: Any) -> dict[str, Any]:
    response = api_client.get("/api/insights/distribution", params=params)
    assert response.status_code == 200
    return response.json()


def most_common_country(rows: Rows) -> str:
    countries = [row["country"] for row in rows]
    return max(sorted(set(countries)), key=countries.count)


def test_distribution_without_country_covers_all_usd_salaries(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    usd_salaries = [expected_usd_salary(row) for row in seeded_employees]

    # Act
    body = read_distribution(api_client, bins=20)

    # Assert
    assert body["currency"] == "USD"
    assert len(body["bins"]) == 20
    assert sum(salary_bin["count"] for salary_bin in body["bins"]) == len(usd_salaries)
    assert body["bins"][0]["lower_bound"] == min(usd_salaries)
    assert body["bins"][-1]["upper_bound"] == max(usd_salaries)


def test_distribution_with_country_uses_local_salaries(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    country = most_common_country(seeded_employees)
    local_salaries = [r["salary_amount"] for r in seeded_employees if r["country"] == country]

    # Act
    body = read_distribution(api_client, country=country, bins=5)

    # Assert
    assert body["currency"] == CURRENCY_BY_COUNTRY[country]
    assert sum(salary_bin["count"] for salary_bin in body["bins"]) == len(local_salaries)
    assert body["bins"][0]["lower_bound"] == min(local_salaries)
    assert body["bins"][-1]["upper_bound"] == max(local_salaries)


def test_distribution_defaults_to_twenty_bins(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    expected_bin_count = 20

    # Act
    body = read_distribution(api_client)

    # Assert
    assert len(body["bins"]) == expected_bin_count


def test_distribution_returns_empty_bins_when_no_employee_matches(
    api_client: TestClient,
) -> None:
    # Arrange
    params = {"country": "India", "bins": 20}  # database is empty

    # Act
    body = read_distribution(api_client, **params)

    # Assert
    assert body["bins"] == []
    assert body["currency"] == "INR"


def test_distribution_rejects_unknown_country(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"country": "Atlantis"}

    # Act
    response = api_client.get("/api/insights/distribution", params=params)

    # Assert
    assert response.status_code == 422
