from datetime import date, datetime
from types import SimpleNamespace
from typing import Any

from app.schemas.employee import EmployeeRead


def build_stored_employee(**overrides: Any) -> SimpleNamespace:
    fields = {
        "id": 1,
        "employee_code": "EMP-00001",
        "first_name": "Asha",
        "last_name": "Rao",
        "email": "asha.rao@acme.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary_amount": 2_400_000,
        "salary_currency": "INR",
        "hire_date": date(2021, 4, 1),
        "created_at": datetime(2026, 1, 1, 9, 0),
        "updated_at": datetime(2026, 1, 1, 9, 0),
    }
    return SimpleNamespace(**(fields | overrides))


def test_employee_read_usd_equivalent_converts_local_salary_at_fixed_rate() -> None:
    # Arrange: 2,400,000 INR at 88 INR per USD is 27,272.7, which rounds half-up to 27,273
    stored_employee = build_stored_employee(salary_amount=2_400_000, salary_currency="INR")

    # Act
    employee = EmployeeRead.model_validate(stored_employee)

    # Assert
    assert employee.salary_usd_equivalent == 27_273


def test_employee_read_usd_equivalent_equals_salary_when_paid_in_usd() -> None:
    # Arrange
    stored_employee = build_stored_employee(
        country="United States", salary_amount=185_000, salary_currency="USD"
    )

    # Act
    employee = EmployeeRead.model_validate(stored_employee)

    # Assert
    assert employee.salary_usd_equivalent == 185_000


def test_employee_read_usd_equivalent_is_an_integer() -> None:
    # Arrange: money stays an int end to end (D-004)
    stored_employee = build_stored_employee(
        country="Germany", salary_amount=72_000, salary_currency="EUR"
    )

    # Act
    employee = EmployeeRead.model_validate(stored_employee)

    # Assert
    assert isinstance(employee.salary_usd_equivalent, int)
    assert employee.salary_usd_equivalent == 83_721
