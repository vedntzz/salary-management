from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, field_validator

from app.services.currency import CURRENCY_BY_COUNTRY

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
