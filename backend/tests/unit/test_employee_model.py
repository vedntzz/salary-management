from datetime import date
from typing import Any

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee


def build_employee(**overrides: Any) -> Employee:
    fields = {
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
    }
    return Employee(**(fields | overrides))


def test_employee_model_assigns_id_when_saved(session: Session) -> None:
    # Arrange
    employee = build_employee()

    # Act
    session.add(employee)
    session.flush()

    # Assert
    assert employee.id is not None


def test_employee_model_sets_timestamps_when_saved(session: Session) -> None:
    # Arrange
    employee = build_employee()

    # Act
    session.add(employee)
    session.flush()
    session.refresh(employee)

    # Assert
    assert employee.created_at is not None
    assert employee.updated_at is not None


def test_employee_model_returns_salary_as_int_when_read_back(session: Session) -> None:
    # Arrange
    session.add(build_employee(salary_amount=2_400_000))
    session.commit()
    session.expire_all()

    # Act
    stored = session.query(Employee).one()

    # Assert
    assert stored.salary_amount == 2_400_000
    assert isinstance(stored.salary_amount, int)


def test_employee_model_rejects_duplicate_email(session: Session) -> None:
    # Arrange
    session.add(build_employee(employee_code="EMP-00001"))
    session.add(build_employee(employee_code="EMP-00002"))

    # Act / Assert
    with pytest.raises(IntegrityError):
        session.flush()


def test_employee_model_rejects_duplicate_employee_code(session: Session) -> None:
    # Arrange
    session.add(build_employee(email="asha.rao@acme.com"))
    session.add(build_employee(email="asha.r@acme.com"))

    # Act / Assert
    with pytest.raises(IntegrityError):
        session.flush()
