from sqlalchemy.orm import Session

from app.currency import CURRENCY_BY_COUNTRY
from app.models.employee import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import (
    EmployeeCreate,
    EmployeePage,
    EmployeeQuery,
    EmployeeRead,
    EmployeeUpdate,
    FilterOptions,
)

EMPLOYEE_CODE_PREFIX = "EMP-"


class EmployeeNotFoundError(Exception):
    def __init__(self) -> None:
        super().__init__("Employee not found")


class DuplicateEmailError(Exception):
    def __init__(self) -> None:
        super().__init__("An employee with this email already exists")


class EmployeeService:
    def __init__(self, repository: EmployeeRepository) -> None:
        self.repository = repository

    def get_employee(self, employee_id: int) -> Employee:
        employee = self.repository.find_by_id(employee_id)
        if employee is None:
            raise EmployeeNotFoundError()
        return employee

    def list_employees(self, query: EmployeeQuery) -> EmployeePage:
        employees, total = self.repository.search(query)
        return EmployeePage(
            items=[EmployeeRead.model_validate(employee) for employee in employees],
            total=total,
            page=query.page,
            page_size=query.page_size,
        )

    def list_filter_options(self) -> FilterOptions:
        return FilterOptions(
            countries=self.repository.find_distinct_values("country"),
            departments=self.repository.find_distinct_values("department"),
            job_titles=self.repository.find_distinct_values("job_title"),
            currency_by_country=dict(CURRENCY_BY_COUNTRY),
        )

    def create_employee(self, payload: EmployeeCreate) -> Employee:
        self.ensure_email_available(payload.email)
        fields = payload.model_dump() | {"employee_code": self.generate_next_employee_code()}
        return self.repository.create(fields)

    def update_employee(self, employee_id: int, payload: EmployeeUpdate) -> Employee:
        employee = self.get_employee(employee_id)
        changes = payload.model_dump(exclude_unset=True)
        if "email" in changes:
            self.ensure_email_available(changes["email"], excluding_id=employee_id)
        if "country" in changes:
            # Currency follows country, so it can never disagree with it (D-003).
            changes["salary_currency"] = CURRENCY_BY_COUNTRY[changes["country"]]
        return self.repository.update(employee, changes)

    def delete_employee(self, employee_id: int) -> None:
        self.repository.delete(self.get_employee(employee_id))

    def ensure_email_available(self, email: str, excluding_id: int | None = None) -> None:
        if self.repository.email_exists(email, excluding_id):
            raise DuplicateEmailError()

    def generate_next_employee_code(self) -> str:
        # Highest code plus one, so a deleted employee's code is never reused.
        highest_code = self.repository.find_highest_employee_code()
        if highest_code is None:
            return f"{EMPLOYEE_CODE_PREFIX}00001"
        next_number = int(highest_code.removeprefix(EMPLOYEE_CODE_PREFIX)) + 1
        return f"{EMPLOYEE_CODE_PREFIX}{next_number:05d}"


def build_employee_service(session: Session) -> EmployeeService:
    return EmployeeService(EmployeeRepository(session))
