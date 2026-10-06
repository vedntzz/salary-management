from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.currency import CURRENCY_BY_COUNTRY, convert_local_to_usd
from app.repositories.employee_repository import EmployeeRepository, GroupSalaryRange
from app.schemas.insights import (
    DimensionPayStats,
    DimensionQuery,
    DistributionQuery,
    GroupPayStats,
    PayrollSummary,
    SalaryBinRead,
    SalaryDistribution,
)
from app.services.statistics import build_salary_histogram, calculate_median_salary

REPORTING_CURRENCY = "USD"
SalaryRange = tuple[int, int, int]


def calculate_average_salary(salaries: list[int]) -> int:
    mean = Decimal(sum(salaries)) / len(salaries)
    return int(mean.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def convert_range(salary_range: GroupSalaryRange, in_usd: bool) -> SalaryRange:
    lowest, highest = salary_range.lowest, salary_range.highest
    if in_usd:
        # Half-up conversion never reverses order, so converted min/max stay the extremes.
        lowest = convert_local_to_usd(lowest, salary_range.currency)
        highest = convert_local_to_usd(highest, salary_range.currency)
    return salary_range.count, lowest, highest


def merge_ranges_by_group(ranges: list[GroupSalaryRange], in_usd: bool) -> dict[str, SalaryRange]:
    merged: dict[str, SalaryRange] = {}
    for salary_range in ranges:
        count, lowest, highest = convert_range(salary_range, in_usd)
        if salary_range.group in merged:
            seen_count, seen_lowest, seen_highest = merged[salary_range.group]
            count, lowest = count + seen_count, min(lowest, seen_lowest)
            highest = max(highest, seen_highest)
        merged[salary_range.group] = (count, lowest, highest)
    return merged


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
        ranges = merge_ranges_by_group(
            self.repository.summarize_salary_ranges(query.dimension), in_usd
        )
        salaries = self.group_salaries(query.dimension, in_usd)
        rows = [
            GroupPayStats(
                group=group,
                currency=REPORTING_CURRENCY if in_usd else CURRENCY_BY_COUNTRY[group],
                count=count,
                min=lowest,
                max=highest,
                avg=calculate_average_salary(salaries[group]),
                median=calculate_median_salary(salaries[group]),
            )
            for group, (count, lowest, highest) in sorted(ranges.items())
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
