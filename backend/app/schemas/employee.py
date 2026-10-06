from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, field_validator

from app.currency import CURRENCY_BY_COUNTRY

Country = Literal[
    "United States",
    "United Kingdom",
    "India",
    "Germany",
    "Canada",
    "Australia",
    "Singapore",
    "Brazil",
]
Department = Literal["Engineering", "Product", "Sales", "Marketing", "Finance", "People"]
SortOption = Literal["name", "-name", "salary", "-salary", "hire_date", "-hire_date"]
MAX_PAGE_SIZE = 100


class EmployeeFields(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    job_title: str
    department: Department
    country: Country
    salary_amount: int = Field(gt=0)
    hire_date: date


class EmployeeCreate(EmployeeFields):
    # Forbid extras so clients can't send salary_currency and contradict the country (D-003).
    model_config = ConfigDict(extra="forbid")

    @computed_field
    @property
    def salary_currency(self) -> str:
        return CURRENCY_BY_COUNTRY[self.country]


class EmployeeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    job_title: str | None = None
    department: Department | None = None
    country: Country | None = None
    salary_amount: int | None = Field(default=None, gt=0)
    hire_date: date | None = None

    @field_validator("*", mode="before")
    @classmethod
    def reject_explicit_null(cls, value: object) -> object:
        # Omitting a field leaves it unchanged; null would blank a required column.
        if value is None:
            raise ValueError("must not be null")
        return value


class EmployeeRead(EmployeeFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    salary_currency: str
    created_at: datetime
    updated_at: datetime


class EmployeeQuery(BaseModel):
    search: str | None = None
    country: str | None = None
    department: str | None = None
    job_title: str | None = None
    sort: SortOption | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1)

    @field_validator("page_size")
    @classmethod
    def cap_page_size(cls, value: int) -> int:
        # Clamp rather than reject, so the browser never pulls more than one page (D-007).
        return min(value, MAX_PAGE_SIZE)


class EmployeePage(BaseModel):
    items: list[EmployeeRead]
    total: int
    page: int
    page_size: int


class FilterOptions(BaseModel):
    countries: list[str]
    departments: list[str]
    job_titles: list[str]
    # All supported countries, not only those with employees, so the form can add the first (D-017).
    currency_by_country: dict[str, str]
