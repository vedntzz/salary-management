from fastapi.testclient import TestClient

from tests.factories import build_employee_payload


def test_get_employee_includes_salary_usd_equivalent(api_client: TestClient) -> None:
    # Arrange: 2,400,000 INR at 88 INR per USD rounds half-up to 27,273
    created = api_client.post("/api/employees", json=build_employee_payload()).json()

    # Act
    response = api_client.get(f"/api/employees/{created['id']}")

    # Assert
    assert response.status_code == 200
    assert response.json()["salary_usd_equivalent"] == 27_273


def test_list_employees_items_include_salary_usd_equivalent(api_client: TestClient) -> None:
    # Arrange
    api_client.post(
        "/api/employees",
        json=build_employee_payload(country="United States", salary_amount=185_000),
    )

    # Act
    response = api_client.get("/api/employees")

    # Assert
    [item] = response.json()["items"]
    assert item["salary_usd_equivalent"] == 185_000


def test_post_employee_response_includes_salary_usd_equivalent(api_client: TestClient) -> None:
    # Arrange
    payload = build_employee_payload(country="Germany", salary_amount=72_000)

    # Act
    response = api_client.post("/api/employees", json=payload)

    # Assert
    assert response.status_code == 201
    assert response.json()["salary_usd_equivalent"] == 83_721
