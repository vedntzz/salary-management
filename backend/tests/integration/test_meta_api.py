from typing import Any

from fastapi.testclient import TestClient


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
    assert response.json() == expected
