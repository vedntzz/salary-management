from datetime import date

import pytest
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.services.employee_service import (
    DuplicateEmailError,
    EmployeeNotFoundError,
    EmployeeService,
)
from tests.factories import build_employee_payload

MISSING_ID = 9_999


def build_service(session: Session) -> EmployeeService:
    return EmployeeService(EmployeeRepository(session))


def build_create(**overrides: object) -> EmployeeCreate:
    return EmployeeCreate(**build_employee_payload(**overrides))


def test_create_employee_generates_first_code_when_no_employees_exist(session: Session) -> None:
    # Arrange
    service = build_service(session)

    # Act
    employee = service.create_employee(build_create())

    # Assert
    assert employee.employee_code == "EMP-00001"


def test_create_employee_generates_code_after_highest_existing(session: Session) -> None:
    # Arrange
    session.add(
        Employee(
            employee_code="EMP-00041", first_name="Liam", last_name="Smith",
            email="liam.smith@acme.com", job_title="Recruiter", department="People",
            country="Canada", salary_amount=80_000, salary_currency="CAD",
            hire_date=date(2020, 1, 1),
        )
    )
    session.commit()
    service = build_service(session)

    # Act
    employee = service.create_employee(build_create())

    # Assert
    assert employee.employee_code == "EMP-00042"


def test_create_employee_raises_conflict_when_email_exists(session: Session) -> None:
    # Arrange
    service = build_service(session)
    service.create_employee(build_create(email="asha.rao@acme.com"))

    # Act / Assert
    with pytest.raises(DuplicateEmailError):
        service.create_employee(build_create(email="asha.rao@acme.com"))


def test_update_employee_raises_not_found_when_id_missing(session: Session) -> None:
    # Arrange
    service = build_service(session)

    # Act / Assert
    with pytest.raises(EmployeeNotFoundError):
        service.update_employee(MISSING_ID, EmployeeUpdate(salary_amount=90_000))


def test_delete_employee_raises_not_found_when_id_missing(session: Session) -> None:
    # Arrange
    service = build_service(session)

    # Act / Assert
    with pytest.raises(EmployeeNotFoundError):
        service.delete_employee(MISSING_ID)


def test_update_employee_rederives_currency_when_country_changes(session: Session) -> None:
    # Arrange
    service = build_service(session)
    employee = service.create_employee(build_create(country="India"))

    # Act
    updated = service.update_employee(employee.id, EmployeeUpdate(country="Germany"))

    # Assert
    assert updated.salary_currency == "EUR"
