from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

from sqlalchemy import Row
from sqlalchemy.orm import Session

from app.currency import CURRENCY_BY_COUNTRY, convert_local_to_usd
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.insights import (
    DimensionPayStats,
    DimensionQuery,
    DistributionQuery,
    GroupPayStats,
    OutlierItem,
    OutlierQuery,
    OutlierReport,
    PayrollSummary,
    SalaryBinRead,
    SalaryDistribution,
)
from app.services.statistics import (
    build_salary_histogram,
    calculate_average_salary,
    calculate_median_salary,
)

REPORTING_CURRENCY = "USD"
OutlierCandidate = tuple[Decimal, Row[Any], int]


def build_group_stats(group: str, currency: str, salaries: list[int]) -> GroupPayStats:
    return GroupPayStats(
        group=group,
        currency=currency,
        count=len(salaries),
        min=min(salaries),
        max=max(salaries),
        avg=calculate_average_salary(salaries),
        median=calculate_median_salary(salaries),
    )


def calculate_deviation(salary: int, median: int) -> Decimal:
    return Decimal(salary - median) / Decimal(median)


def build_outlier_item(candidate: OutlierCandidate) -> OutlierItem:
    deviation, record, median = candidate
    percent = (deviation * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
    return OutlierItem(
        id=record.id,
        employee_code=record.employee_code,
        name=f"{record.first_name} {record.last_name}",
        job_title=record.job_title,
        country=record.country,
        salary=record.salary_amount,
        currency=record.salary_currency,
        group_median=median,
        deviation_percent=float(percent),
        direction="above" if deviation > 0 else "below",
    )


def find_group_outliers(members: list[Row[Any]], threshold: Decimal) -> list[OutlierCandidate]:
    # Groups are single-country, so medians compare in local currency (D-008).
    median = calculate_median_salary([member.salary_amount for member in members])
    candidates = [
        (calculate_deviation(member.salary_amount, median), member, median) for member in members
    ]
    return [candidate for candidate in candidates if abs(candidate[0]) > threshold]


class InsightsService:
    def __init__(self, repository: EmployeeRepository) -> None:
        self.repository = repository

    def summarize_payroll(self) -> PayrollSummary:
        usd_salaries = self.list_usd_salaries()
        return PayrollSummary(
            currency=REPORTING_CURRENCY,
            headcount=len(usd_salaries),
            total_payroll=sum(usd_salaries),
            median_payroll=calculate_median_salary(usd_salaries) if usd_salaries else None,
            headcount_by_country=self.repository.count_employees_by_country(),
        )

    def compare_pay_by_dimension(self, query: DimensionQuery) -> DimensionPayStats:
        in_usd = query.currency == "usd"
        groups = self.group_salaries(query.dimension, in_usd)
        rows = [
            build_group_stats(
                group, REPORTING_CURRENCY if in_usd else CURRENCY_BY_COUNTRY[group], salaries
            )
            for group, salaries in sorted(groups.items())
        ]
        return DimensionPayStats(dimension=query.dimension, rows=rows)

    def build_distribution(self, query: DistributionQuery) -> SalaryDistribution:
        if query.country is None:
            currency, salaries = REPORTING_CURRENCY, self.list_usd_salaries()
        else:
            currency = CURRENCY_BY_COUNTRY[query.country]
            salaries = [amount for _, amount in self.repository.list_salaries(query.country)]
        histogram = build_salary_histogram(salaries, query.bins) if salaries else []
        bins = [SalaryBinRead.model_validate(salary_bin) for salary_bin in histogram]
        return SalaryDistribution(currency=currency, bins=bins)

    def find_outliers(self, query: OutlierQuery) -> OutlierReport:
        groups: dict[tuple[str, str], list[Row[Any]]] = defaultdict(list)
        for record in self.repository.list_salary_records():
            groups[(record.job_title, record.country)].append(record)
        candidates = [
            candidate
            for members in groups.values()
            if len(members) >= query.min_group_size
            for candidate in find_group_outliers(members, query.threshold)
        ]
        # Exact deviation orders the list; id breaks ties so the order is stable.
        candidates.sort(key=lambda candidate: (-abs(candidate[0]), candidate[1].id))
        return OutlierReport(items=[build_outlier_item(candidate) for candidate in candidates])

    def list_usd_salaries(self) -> list[int]:
        rows = self.repository.list_salaries()
        return [convert_local_to_usd(amount, currency) for currency, amount in rows]

    def group_salaries(self, dimension: str, in_usd: bool) -> dict[str, list[int]]:
        groups: dict[str, list[int]] = defaultdict(list)
        for group, currency, amount in self.repository.list_salaries_by_group(dimension):
            # Convert each salary before aggregating (D-016).
            groups[group].append(convert_local_to_usd(amount, currency) if in_usd else amount)
        return groups


def build_insights_service(session: Session) -> InsightsService:
    return InsightsService(EmployeeRepository(session))
