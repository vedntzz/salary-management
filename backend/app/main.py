from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import employees, meta
from app.config import settings
from app.services.employee_service import DuplicateEmailError, EmployeeNotFoundError

# The one place domain errors become HTTP statuses.
STATUS_CODE_BY_DOMAIN_ERROR: dict[type[Exception], int] = {
    EmployeeNotFoundError: status.HTTP_404_NOT_FOUND,
    DuplicateEmailError: status.HTTP_409_CONFLICT,
}

app = FastAPI(title="ACME Salary Management")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(employees.router)
app.include_router(meta.router)


def handle_domain_error(request: Request, error: Exception) -> JSONResponse:
    status_code = STATUS_CODE_BY_DOMAIN_ERROR[type(error)]
    return JSONResponse(status_code=status_code, content={"detail": str(error)})


for domain_error in STATUS_CODE_BY_DOMAIN_ERROR:
    app.add_exception_handler(domain_error, handle_domain_error)


@app.get("/api/health")
def read_health_status() -> dict[str, str]:
    return {"status": "ok"}
