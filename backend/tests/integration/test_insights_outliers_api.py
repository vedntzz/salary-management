from itertools import count
from typing import Any

import pytest
from fastapi.testclient import TestClient

from tests.factories import build_employee_payload

BASELINE = 2_000_000
email_numbers = count(1)


def create_group(
    api_client: TestClient, salaries: list[int], job_title: str = "Analyst", country: str = "India"
) -> list[dict[str, Any]]:
    created = []
    for salary in salaries:
        email = f"outlier.{next(email_numbers)}@acme.com"
        payload = build_employee_payload(
            email=email, job_title=job_title, country=country, salary_amount=salary
        )
        response = api_client.post("/api/employees", json=payload)
        assert response.status_code == 201
        created.append(response.json())
    return created


def read_outliers(api_client: TestClient, **params: Any) -> list[dict[str, Any]]:
    response = api_client.get("/api/insights/outliers", params=params)
    assert response.status_code == 200
    return response.json()["items"]


def test_outliers_flags_salary_thirty_percent_above_group_median(api_client: TestClient) -> None:
    # Arrange
    *_, candidate = create_group(api_client, [BASELINE] * 4 + [2_600_000])

    # Act
    items = read_outliers(api_client)

    # Assert
    assert [item["id"] for item in items] == [candidate["id"]]
    assert items[0]["direction"] == "above"


def test_outliers_ignores_salary_twenty_percent_above_group_median(api_client: TestClient) -> None:
    # Arrange
    create_group(api_client, [BASELINE] * 4 + [2_400_000])

    # Act
    items = read_outliers(api_client)

    # Assert
    assert items == []


def test_outliers_ignores_salary_exactly_at_threshold(api_client: TestClient) -> None:
    # Arrange
    create_group(api_client, [BASELINE] * 4 + [2_500_000])  # exactly +25%

    # Act
    items = read_outliers(api_client, threshold=0.25)

    # Assert
    assert items == []


def test_outliers_flags_salary_thirty_percent_below_group_median(api_client: TestClient) -> None:
    # Arrange
    *_, candidate = create_group(api_client, [BASELINE] * 4 + [1_400_000])

    # Act
    items = read_outliers(api_client)

    # Assert
    assert [item["id"] for item in items] == [candidate["id"]]
    assert items[0]["direction"] == "below"


def test_outliers_skips_groups_smaller_than_min_group_size(api_client: TestClient) -> None:
    # Arrange
    create_group(api_client, [BASELINE] * 3 + [2_600_000])

    # Act
    items = read_outliers(api_client, min_group_size=5)

    # Assert
    assert items == []


def test_outliers_includes_group_once_min_group_size_allows_it(api_client: TestClient) -> None:
    # Arrange
    *_, candidate = create_group(api_client, [BASELINE] * 3 + [2_600_000])

    # Act
    items = read_outliers(api_client, min_group_size=4)

    # Assert
    assert [item["id"] for item in items] == [candidate["id"]]


def test_outliers_returns_employee_and_group_details(api_client: TestClient) -> None:
    # Arrange
    *_, candidate = create_group(api_client, [BASELINE] * 4 + [2_600_000])

    # Act
    items = read_outliers(api_client)

    # Assert
    assert items == [
        {
            "id": candidate["id"],
            "employee_code": candidate["employee_code"],
            "name": f"{candidate['first_name']} {candidate['last_name']}",
            "job_title": "Analyst",
            "country": "India",
            "salary": 2_600_000,
            "currency": "INR",
            "group_median": BASELINE,
            "deviation_percent": 30.0,
            "direction": "above",
        }
    ]


def test_outliers_compares_within_job_title_and_country(api_client: TestClient) -> None:
    # Arrange
    create_group(api_client, [BASELINE] * 5, job_title="Analyst")
    create_group(api_client, [2_600_000] * 5, job_title="Architect")

    # Act
    items = read_outliers(api_client)

    # Assert
    assert items == []


def test_outliers_sorts_by_absolute_deviation_descending(api_client: TestClient) -> None:
    # Arrange
    *_, above = create_group(api_client, [BASELINE] * 4 + [2_600_000], job_title="Analyst")
    *_, below = create_group(api_client, [BASELINE] * 4 + [1_000_000], job_title="Architect")

    # Act
    items = read_outliers(api_client)

    # Assert
    assert [item["id"] for item in items] == [below["id"], above["id"]]
    assert [item["deviation_percent"] for item in items] == [-50.0, 30.0]


def test_outliers_uses_threshold_parameter(api_client: TestClient) -> None:
    # Arrange
    *_, candidate = create_group(api_client, [BASELINE] * 4 + [2_400_000])

    # Act
    items = read_outliers(api_client, threshold=0.15)

    # Assert
    assert [item["id"] for item in items] == [candidate["id"]]


@pytest.mark.parametrize("threshold", [0.0, 0.009, 1.01])
def test_outliers_rejects_threshold_outside_allowed_range(
    api_client: TestClient, threshold: float
) -> None:
    # Arrange
    params = {"threshold": threshold}

    # Act
    response = api_client.get("/api/insights/outliers", params=params)

    # Assert
    assert response.status_code == 422
