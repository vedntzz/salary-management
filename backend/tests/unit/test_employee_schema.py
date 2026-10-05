from typing import Any

import pytest
from app.schemas.employee import EmployeeCreate
from pydantic import ValidationError


def build_employee_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "first_name": "Asha",
        "last_name": "Rao",
        "email": "asha.rao@acme.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary_amount": 2_400_000,
    }
    return payload | overrides


def test_employee_create_accepts_positive_integer_salary() -> None:
    # Arrange
    payload = build_employee_payload(salary_amount=85_000)

    # Act
    employee = EmployeeCreate(**payload)

    # Assert
    assert employee.salary_amount == 85_000
    assert isinstance(employee.salary_amount, int)


@pytest.mark.parametrize("salary_amount", [0, -1, -50_000])
def test_employee_create_rejects_salary_when_not_positive(salary_amount: int) -> None:
    # Arrange
    payload = build_employee_payload(salary_amount=salary_amount)

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)


def test_employee_create_rejects_salary_when_fractional() -> None:
    # Arrange
    payload = build_employee_payload(salary_amount=85_000.5)

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)


@pytest.mark.parametrize(
    "country",
    [
        "United States",
        "United Kingdom",
        "India",
        "Germany",
        "Canada",
        "Australia",
        "Singapore",
        "Brazil",
    ],
)
def test_employee_create_accepts_supported_country(country: str) -> None:
    # Arrange
    payload = build_employee_payload(country=country)

    # Act
    employee = EmployeeCreate(**payload)

    # Assert
    assert employee.country == country


@pytest.mark.parametrize("country", ["France", "Japan", "india", ""])
def test_employee_create_rejects_country_when_unsupported(country: str) -> None:
    # Arrange
    payload = build_employee_payload(country=country)

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)


@pytest.mark.parametrize(
    "department",
    ["Engineering", "Product", "Sales", "Marketing", "Finance", "People"],
)
def test_employee_create_accepts_supported_department(department: str) -> None:
    # Arrange
    payload = build_employee_payload(department=department)

    # Act
    employee = EmployeeCreate(**payload)

    # Assert
    assert employee.department == department


@pytest.mark.parametrize("department", ["Legal", "HR", "engineering", ""])
def test_employee_create_rejects_department_when_unsupported(department: str) -> None:
    # Arrange
    payload = build_employee_payload(department=department)

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)


@pytest.mark.parametrize("email", ["not-an-email", "asha@", "@acme.com", "asha rao@acme.com"])
def test_employee_create_rejects_email_when_invalid(email: str) -> None:
    # Arrange
    payload = build_employee_payload(email=email)

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)


@pytest.mark.parametrize(
    ("country", "expected_currency"),
    [
        ("United States", "USD"),
        ("United Kingdom", "GBP"),
        ("India", "INR"),
        ("Germany", "EUR"),
        ("Canada", "CAD"),
        ("Australia", "AUD"),
        ("Singapore", "SGD"),
        ("Brazil", "BRL"),
    ],
)
def test_employee_create_derives_salary_currency_from_country(
    country: str, expected_currency: str
) -> None:
    # Arrange
    payload = build_employee_payload(country=country)

    # Act
    employee = EmployeeCreate(**payload)

    # Assert
    assert employee.salary_currency == expected_currency


def test_employee_create_rejects_salary_currency_when_given_as_input() -> None:
    # Arrange
    payload = build_employee_payload(country="India", salary_currency="USD")

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeCreate(**payload)
