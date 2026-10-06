from fastapi import APIRouter

from app.api.employees import EmployeeServiceDependency
from app.schemas.employee import FilterOptions

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/filters")
def read_filter_options(service: EmployeeServiceDependency) -> FilterOptions:
    return service.list_filter_options()
