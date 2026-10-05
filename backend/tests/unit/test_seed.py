from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate
from seed.salary_bands import salary_band_for
from seed.seed import generate_employees, seed_employees

SEED = 42
COUNT = 50
FIRST_NAMES = ["Asha", "Liam", "Mei", "Omar", "Sofia"]
LAST_NAMES = ["Rao", "Smith", "Chen", "Haddad", "Silva"]


def generate_sample_employees() -> list[dict]:
    return generate_employees(FIRST_NAMES, LAST_NAMES, count=COUNT, seed=SEED)


def count_employees(session: Session) -> int:
    return session.scalar(select(func.count()).select_from(Employee))


def test_generate_employees_returns_identical_rows_for_same_seed() -> None:
    # Arrange
    first_run = generate_sample_employees()

    # Act
    second_run = generate_sample_employees()

    # Assert
    assert first_run == second_run


def test_generate_employees_keeps_every_salary_inside_its_title_country_band() -> None:
    # Arrange
    rows = generate_sample_employees()

    # Act
    bands = [salary_band_for(row["job_title"], row["country"]) for row in rows]
    out_of_band = [
        row for row, (low, high) in zip(rows, bands, strict=True)
        if not low <= row["salary_amount"] <= high
    ]

    # Assert
    assert out_of_band == []


def test_generate_employees_numbers_codes_upward_from_emp_00001() -> None:
    # Arrange
    expected_codes = [f"EMP-{number:05d}" for number in range(1, COUNT + 1)]

    # Act
    rows = generate_sample_employees()

    # Assert
    assert [row["employee_code"] for row in rows] == expected_codes


def test_generate_employees_keeps_emails_unique_when_names_repeat() -> None:
    # Arrange
    first_names, last_names = ["Asha", "Liam"], ["Rao", "Smith"]

    # Act
    rows = generate_employees(first_names, last_names, count=COUNT, seed=SEED)

    # Assert
    assert len({row["email"] for row in rows}) == COUNT


def test_generate_employees_produces_rows_that_validate_as_employee_create() -> None:
    # Arrange
    rows = generate_sample_employees()

    # Act
    created = [
        EmployeeCreate(**{field: row[field] for field in EmployeeCreate.model_fields})
        for row in rows
    ]

    # Assert
    assert [employee.salary_currency for employee in created] == [
        row["salary_currency"] for row in rows
    ]


def test_seed_employees_inserts_requested_count(session: Session) -> None:
    # Arrange
    rows = generate_sample_employees()

    # Act
    seed_employees(session, rows)

    # Assert
    assert count_employees(session) == COUNT


def test_seed_employees_replaces_existing_rows_when_run_twice(session: Session) -> None:
    # Arrange
    rows = generate_sample_employees()
    seed_employees(session, rows)

    # Act
    seed_employees(session, rows)

    # Assert
    assert count_employees(session) == COUNT
