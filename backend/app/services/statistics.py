from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True)
class SalaryBin:
    lower_bound: int
    upper_bound: int
    count: int


def round_half_up(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calculate_median_salary(salaries: list[int]) -> int:
    if not salaries:
        raise ValueError("Cannot take the median of no salaries")
    ordered = sorted(salaries)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return round_half_up(Decimal(ordered[middle - 1] + ordered[middle]) / 2)


def calculate_average_salary(salaries: list[int]) -> int:
    if not salaries:
        raise ValueError("Cannot take the average of no salaries")
    return round_half_up(Decimal(sum(salaries)) / len(salaries))


def build_salary_histogram(salaries: list[int], bins: int) -> list[SalaryBin]:
    lowest, highest = min(salaries), max(salaries)
    span = highest - lowest
    # A zero span would divide by zero, and one bin already says everyone earns the same.
    if span == 0:
        return [SalaryBin(lowest, highest, len(salaries))]
    counts = [0] * bins
    for salary in salaries:
        # Integer arithmetic keeps money off floats (D-004); the max is clamped into the last bin.
        counts[min((salary - lowest) * bins // span, bins - 1)] += 1
    edges = [lowest + index * span // bins for index in range(bins + 1)]
    return [SalaryBin(edges[i], edges[i + 1], counts[i]) for i in range(bins)]
