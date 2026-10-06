from typing import Any

from sqlalchemy import ColumnElement, Row, Select, UnaryExpression, func, or_, select
from sqlalchemy.orm import Session

from app.currency import build_usd_equivalent_expression
from app.models.employee import Employee
from app.schemas.employee import EmployeeQuery

SORT_COLUMNS: dict[str, tuple[ColumnElement, ...]] = {
    "name": (Employee.last_name, Employee.first_name),
    "salary": (build_usd_equivalent_expression(Employee.salary_amount, Employee.salary_currency),),
    "hire_date": (Employee.hire_date,),
}
GROUPABLE_COLUMNS: dict[str, ColumnElement[str]] = {
    "country": Employee.country,
    "department": Employee.department,
    "job_title": Employee.job_title,
}
SEARCHABLE_COLUMNS = (
    Employee.first_name,
    Employee.last_name,
    Employee.email,
    Employee.employee_code,
)


def build_filter_conditions(query: EmployeeQuery) -> list[ColumnElement[bool]]:
    exact_filters = (
        (Employee.country, query.country),
        (Employee.department, query.department),
        (Employee.job_title, query.job_title),
    )
    conditions = [column == value for column, value in exact_filters if value is not None]
    if query.search:
        pattern = f"%{query.search.lower()}%"
        conditions.append(or_(*(func.lower(column).like(pattern) for column in SEARCHABLE_COLUMNS)))
    return conditions


def build_ordering(sort: str | None) -> list[UnaryExpression]:
    if sort is None:
        return []
    columns = SORT_COLUMNS[sort.removeprefix("-")]
    return [column.desc() if sort.startswith("-") else column.asc() for column in columns]


class EmployeeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def find_by_id(self, employee_id: int) -> Employee | None:
        return self.session.get(Employee, employee_id)

    def email_exists(self, email: str, excluding_id: int | None = None) -> bool:
        query = select(Employee.id).where(func.lower(Employee.email) == email.lower())
        if excluding_id is not None:
            query = query.where(Employee.id != excluding_id)
        return self.session.scalar(query) is not None

    def search(self, query: EmployeeQuery) -> tuple[list[Employee], int]:
        statement: Select = select(Employee).where(*build_filter_conditions(query))
        total = self.session.scalar(select(func.count()).select_from(statement.subquery()))
        # id breaks ties so pages never overlap when sort keys repeat.
        ordered = statement.order_by(*build_ordering(query.sort), Employee.id)
        page = ordered.offset((query.page - 1) * query.page_size).limit(query.page_size)
        return list(self.session.scalars(page)), total or 0

    def find_distinct_values(self, field_name: str) -> list[str]:
        column = getattr(Employee, field_name)
        return list(self.session.scalars(select(column).distinct().order_by(column)))

    def find_highest_employee_code(self) -> str | None:
        # Codes are zero-padded, so string order matches numeric order.
        return self.session.scalar(select(func.max(Employee.employee_code)))

    def create(self, fields: dict[str, Any]) -> Employee:
        employee = Employee(**fields)
        self.session.add(employee)
        self.session.commit()
        self.session.refresh(employee)
        return employee

    def update(self, employee: Employee, changes: dict[str, Any]) -> Employee:
        for field_name, value in changes.items():
            setattr(employee, field_name, value)
        self.session.commit()
        self.session.refresh(employee)
        return employee

    def delete(self, employee: Employee) -> None:
        self.session.delete(employee)
        self.session.commit()

    def list_salaries_by_group(self, dimension: str) -> list[tuple[str, str, int]]:
        column = GROUPABLE_COLUMNS[dimension]
        statement = select(column, Employee.salary_currency, Employee.salary_amount)
        return [tuple(row) for row in self.session.execute(statement)]

    def list_salaries(self, country: str | None = None) -> list[tuple[str, int]]:
        statement = select(Employee.salary_currency, Employee.salary_amount)
        if country is not None:
            statement = statement.where(Employee.country == country)
        return [tuple(row) for row in self.session.execute(statement)]

    def count_employees_by_country(self) -> dict[str, int]:
        statement = select(Employee.country, func.count()).group_by(Employee.country)
        return {country: count for country, count in self.session.execute(statement)}

    def list_salary_records(self) -> list[Row[Any]]:
        # Plain rows, not ORM objects, keep a 10k-row scan cheap.
        statement = select(
            Employee.id,
            Employee.employee_code,
            Employee.first_name,
            Employee.last_name,
            Employee.job_title,
            Employee.country,
            Employee.salary_amount,
            Employee.salary_currency,
        )
        return list(self.session.execute(statement))
