from collections import Counter
from typing import Any

from fastapi.testclient import TestClient

from tests.insight_expectations import Rows, expected_median, expected_usd_salary


def read_summary(api_client: TestClient) -> dict[str, Any]:
    response = api_client.get("/api/insights/summary")
    assert response.status_code == 200
    return response.json()


def test_summary_returns_headcount_for_seeded_rows(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    expected_headcount = len(seeded_employees)

    # Act
    body = read_summary(api_client)

    # Assert
    assert body["headcount"] == expected_headcount


def test_summary_returns_usd_total_and_median_payroll(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    usd_salaries = [expected_usd_salary(row) for row in seeded_employees]

    # Act
    body = read_summary(api_client)

    # Assert
    assert body["currency"] == "USD"
    assert body["total_payroll"] == sum(usd_salaries)
    assert body["median_payroll"] == expected_median(usd_salaries)


def test_summary_returns_headcount_per_country(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    expected = dict(Counter(row["country"] for row in seeded_employees))

    # Act
    body = read_summary(api_client)

    # Assert
    assert body["headcount_by_country"] == expected

