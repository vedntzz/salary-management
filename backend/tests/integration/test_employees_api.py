from fastapi.testclient import TestClient

from tests.factories import build_employee_payload

MISSING_ID = 9_999


def create_employee(api_client: TestClient, **overrides: object) -> dict:
    response = api_client.post("/api/employees", json=build_employee_payload(**overrides))
    assert response.status_code == 201
    return response.json()


def test_post_employee_returns_201_with_generated_code_and_currency(
    api_client: TestClient,
) -> None:
    # Arrange
    payload = build_employee_payload(country="India")

    # Act
    response = api_client.post("/api/employees", json=payload)

    # Assert
    assert response.status_code == 201
    assert response.json()["employee_code"] == "EMP-00001"
    assert response.json()["salary_currency"] == "INR"


def test_post_employee_returns_409_when_email_exists(api_client: TestClient) -> None:
    # Arrange
    create_employee(api_client, email="asha.rao@acme.com")

    # Act
    response = api_client.post(
        "/api/employees", json=build_employee_payload(email="asha.rao@acme.com")
    )

    # Assert
    assert response.status_code == 409
    assert "detail" in response.json()


def test_post_employee_returns_422_when_body_invalid(api_client: TestClient) -> None:
    # Arrange
    payload = build_employee_payload(salary_amount=-1, country="France")

    # Act
    response = api_client.post("/api/employees", json=payload)

    # Assert
    assert response.status_code == 422


def test_get_employee_returns_200_when_found(api_client: TestClient) -> None:
    # Arrange
    employee = create_employee(api_client)

    # Act
    response = api_client.get(f"/api/employees/{employee['id']}")

    # Assert
    assert response.status_code == 200
    assert response.json()["email"] == "asha.rao@acme.com"


def test_get_employee_returns_404_when_missing(api_client: TestClient) -> None:
    # Arrange
    url = f"/api/employees/{MISSING_ID}"

    # Act
    response = api_client.get(url)

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Employee not found"}


def test_patch_employee_returns_200_with_updated_salary(api_client: TestClient) -> None:
    # Arrange
    employee = create_employee(api_client)

    # Act
    response = api_client.patch(
        f"/api/employees/{employee['id']}", json={"salary_amount": 2_600_000}
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["salary_amount"] == 2_600_000


def test_patch_employee_returns_404_when_missing(api_client: TestClient) -> None:
    # Arrange
    url = f"/api/employees/{MISSING_ID}"

    # Act
    response = api_client.patch(url, json={"salary_amount": 2_600_000})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Employee not found"}


def test_patch_employee_returns_409_when_email_belongs_to_another(
    api_client: TestClient,
) -> None:
    # Arrange
    create_employee(api_client, email="asha.rao@acme.com")
    other = create_employee(api_client, email="liam.smith@acme.com")

    # Act
    response = api_client.patch(
        f"/api/employees/{other['id']}", json={"email": "asha.rao@acme.com"}
    )

    # Assert
    assert response.status_code == 409
    assert "detail" in response.json()


def test_patch_employee_returns_422_when_salary_not_positive(api_client: TestClient) -> None:
    # Arrange
    employee = create_employee(api_client)

    # Act
    response = api_client.patch(f"/api/employees/{employee['id']}", json={"salary_amount": 0})

    # Assert
    assert response.status_code == 422


def test_patch_employee_returns_422_when_required_field_is_null(
    api_client: TestClient,
) -> None:
    # Arrange
    employee = create_employee(api_client)

    # Act
    response = api_client.patch(f"/api/employees/{employee['id']}", json={"country": None})

    # Assert
    assert response.status_code == 422


def test_delete_employee_returns_204_and_removes_employee(api_client: TestClient) -> None:
    # Arrange
    employee = create_employee(api_client)

    # Act
    response = api_client.delete(f"/api/employees/{employee['id']}")

    # Assert
    assert response.status_code == 204
    assert api_client.get(f"/api/employees/{employee['id']}").status_code == 404


def test_delete_employee_returns_404_when_missing(api_client: TestClient) -> None:
    # Arrange
    url = f"/api/employees/{MISSING_ID}"

    # Act
    response = api_client.delete(url)

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Employee not found"}


def test_post_employee_returns_409_when_email_differs_only_by_case(
    api_client: TestClient,
) -> None:
    # Arrange
    create_employee(api_client, email="asha.rao@acme.com")

    # Act
    response = api_client.post(
        "/api/employees", json=build_employee_payload(email="Asha.Rao@acme.com")
    )

    # Assert
    assert response.status_code == 409


def test_patch_employee_returns_409_when_email_differs_only_by_case_from_another(
    api_client: TestClient,
) -> None:
    # Arrange
    create_employee(api_client, email="asha.rao@acme.com")
    other = create_employee(api_client, email="liam.smith@acme.com")

    # Act
    response = api_client.patch(
        f"/api/employees/{other['id']}", json={"email": "Asha.Rao@acme.com"}
    )

    # Assert
    assert response.status_code == 409
