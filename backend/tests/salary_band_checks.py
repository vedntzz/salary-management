from typing import Any, Literal

from seed.salary_bands import salary_band_for

BandPosition = Literal["in_band", "planted_above", "planted_below", "unexpected"]

ABOVE_PERCENT_RANGE = (40, 80)
BELOW_PERCENT_RANGE = (40, 60)


def is_gap_within_percent_range(gap: int, base: int, percent_range: tuple[int, int]) -> bool:
    # One unit of slack each side so integer rounding of the planted amount still counts.
    low_percent, high_percent = percent_range
    return low_percent * base <= 100 * (gap + 1) and 100 * (gap - 1) <= high_percent * base


def classify_salary_against_band(row: dict[str, Any]) -> BandPosition:
    low, high = salary_band_for(row["job_title"], row["country"])
    salary = row["salary_amount"]
    if low <= salary <= high:
        return "in_band"
    if salary > high and is_gap_within_percent_range(salary - high, high, ABOVE_PERCENT_RANGE):
        return "planted_above"
    if salary < low and is_gap_within_percent_range(low - salary, low, BELOW_PERCENT_RANGE):
        return "planted_below"
    return "unexpected"
