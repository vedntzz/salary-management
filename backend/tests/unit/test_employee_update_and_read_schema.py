from datetime import date, datetime
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.employee import EmployeeRead, EmployeeUpdate


def test_employee_update_accepts_empty_payload() -> None:
    # Arrange
    payload: dict[str, object] = {}

    # Act
    update = EmployeeUpdate(**payload)

    # Assert
    assert update.model_dump(exclude_unset=True) == {}


def test_employee_update_keeps_only_fields_that_were_sent() -> None:
    # Arrange
    payload = {"salary_amount": 90_000}

    # Act
    update = EmployeeUpdate(**payload)

    # Assert
    assert update.model_dump(exclude_unset=True) == {"salary_amount": 90_000}


def test_employee_update_rejects_salary_when_not_positive() -> None:
    # Arrange
    payload = {"salary_amount": 0}

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeUpdate(**payload)


def test_employee_update_rejects_country_when_unsupported() -> None:
    # Arrange
    payload = {"country": "France"}

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeUpdate(**payload)


def test_employee_update_rejects_salary_currency_when_given_as_input() -> None:
    # Arrange
    payload = {"salary_currency": "USD"}

    # Act / Assert
    with pytest.raises(ValidationError):
        EmployeeUpdate(**payload)


def test_employee_read_builds_from_stored_employee_attributes() -> None:
    # Arrange
    stored_employee = SimpleNamespace(
        id=1,
        employee_code="EMP-00001",
        first_name="Asha",
        last_name="Rao",
        email="asha.rao@acme.com",
        job_title="Software Engineer",
        department="Engineering",
        country="India",
        salary_amount=2_400_000,
        salary_currency="INR",
        hire_date=date(2021, 4, 1),
        created_at=datetime(2026, 1, 1, 9, 0),
        updated_at=datetime(2026, 1, 1, 9, 0),
    )

    # Act
    employee = EmployeeRead.model_validate(stored_employee)

    # Assert
    assert employee.employee_code == "EMP-00001"
    assert employee.salary_currency == "INR"
    assert employee.hire_date == date(2021, 4, 1)
