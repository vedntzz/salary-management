import random
from datetime import date, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import delete, insert
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine
from app.models.employee import Employee
from app.services.currency import CURRENCY_BY_COUNTRY
from seed.salary_bands import TITLES_BY_DEPARTMENT, salary_band_for

SEED = 42
EMPLOYEE_COUNT = 10_000
SEED_DIRECTORY = Path(__file__).resolve().parent
EARLIEST_HIRE_DATE = date(2015, 1, 1)
HIRE_WINDOW_DAYS = (date(2026, 9, 30) - EARLIEST_HIRE_DATE).days
COUNTRIES = list(CURRENCY_BY_COUNTRY)
DEPARTMENTS = list(TITLES_BY_DEPARTMENT)


def build_email(first_name: str, last_name: str, number: int) -> str:
    # The employee number keeps emails unique when name pairs repeat.
    return f"{first_name}.{last_name}.{number:05d}@acme.com".lower()


def build_employee(
    rng: random.Random, number: int, first_names: list[str], last_names: list[str]
) -> dict[str, Any]:
    first_name, last_name = rng.choice(first_names), rng.choice(last_names)
    department = rng.choice(DEPARTMENTS)
    job_title = rng.choice(TITLES_BY_DEPARTMENT[department])
    country = rng.choice(COUNTRIES)
    return {
        "employee_code": f"EMP-{number:05d}",
        "first_name": first_name,
        "last_name": last_name,
        "email": build_email(first_name, last_name, number),
        "job_title": job_title,
        "department": department,
        "country": country,
        "salary_amount": rng.randint(*salary_band_for(job_title, country)),
        "salary_currency": CURRENCY_BY_COUNTRY[country],
        "hire_date": EARLIEST_HIRE_DATE + timedelta(days=rng.randint(0, HIRE_WINDOW_DAYS)),
    }


def generate_employees(
    first_names: list[str], last_names: list[str], count: int, seed: int
) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    return [build_employee(rng, number, first_names, last_names) for number in range(1, count + 1)]


def seed_employees(session: Session, rows: list[dict[str, Any]]) -> None:
    # Wipe first so reseeding always lands on the same rows (D-009).
    session.execute(delete(Employee))
    session.execute(insert(Employee), rows)
    session.commit()


def read_names(file_name: str) -> list[str]:
    lines = (SEED_DIRECTORY / file_name).read_text().splitlines()
    return [line.strip() for line in lines if line.strip()]


def main() -> None:
    Base.metadata.create_all(engine)
    rows = generate_employees(
        read_names("first_names.txt"), read_names("last_names.txt"), EMPLOYEE_COUNT, SEED
    )
    with SessionLocal() as session:
        seed_employees(session, rows)
    print(f"Seeded {len(rows)} employees")


if __name__ == "__main__":
    main()
