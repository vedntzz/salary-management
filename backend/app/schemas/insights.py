from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.employee import Country

Dimension = Literal["country", "department", "job_title"]
ReportCurrency = Literal["usd", "local"]


class PayrollSummary(BaseModel):
    currency: str
    headcount: int
    total_payroll: int
    median_payroll: int | None
    headcount_by_country: dict[str, int]


class DimensionQuery(BaseModel):
    dimension: Dimension
    currency: ReportCurrency = "usd"

    @model_validator(mode="after")
    def require_country_for_local_currency(self) -> Self:
        # Only country groups share one currency; other groups would mix them.
        if self.currency == "local" and self.dimension != "country":
            raise ValueError("Local currency is only available when grouping by country")
        return self


class GroupPayStats(BaseModel):
    group: str
    currency: str
    count: int
    min: int
    max: int
    avg: int
    median: int


class DimensionPayStats(BaseModel):
    dimension: Dimension
    rows: list[GroupPayStats]


class DistributionQuery(BaseModel):
    country: Country | None = None
    bins: int = Field(default=20, ge=1, le=100)


class SalaryBinRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    lower_bound: int
    upper_bound: int
    count: int


class SalaryDistribution(BaseModel):
    currency: str
    bins: list[SalaryBinRead]
