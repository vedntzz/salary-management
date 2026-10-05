from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee


class EmployeeRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def find_by_id(self, employee_id: int) -> Employee | None:
        return self.session.get(Employee, employee_id)

    def email_exists(self, email: str, excluding_id: int | None = None) -> bool:
        query = select(Employee.id).where(Employee.email == email)
        if excluding_id is not None:
            query = query.where(Employee.id != excluding_id)
        return self.session.scalar(query) is not None

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
