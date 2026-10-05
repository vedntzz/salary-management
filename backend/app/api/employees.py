from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate
from app.services.employee_service import EmployeeService, build_employee_service

router = APIRouter(prefix="/api/employees", tags=["employees"])


def get_employee_service(session: Annotated[Session, Depends(get_session)]) -> EmployeeService:
    return build_employee_service(session)


EmployeeServiceDependency = Annotated[EmployeeService, Depends(get_employee_service)]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, service: EmployeeServiceDependency) -> EmployeeRead:
    return EmployeeRead.model_validate(service.create_employee(payload))


@router.get("/{employee_id}")
def read_employee(employee_id: int, service: EmployeeServiceDependency) -> EmployeeRead:
    return EmployeeRead.model_validate(service.get_employee(employee_id))


@router.patch("/{employee_id}")
def update_employee(
    employee_id: int, payload: EmployeeUpdate, service: EmployeeServiceDependency
) -> EmployeeRead:
    return EmployeeRead.model_validate(service.update_employee(employee_id, payload))


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, service: EmployeeServiceDependency) -> None:
    service.delete_employee(employee_id)
