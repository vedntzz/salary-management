from collections import defaultdict
from decimal import ROUND_HALF_UP, Decimal
from statistics import median
from typing import Any

from app.currency import LOCAL_UNITS_PER_USD

Rows = list[dict[str, Any]]


def round_half_up(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def expected_usd_salary(row: dict[str, Any]) -> int:
    rate = LOCAL_UNITS_PER_USD[row["salary_currency"]]
    return round_half_up(Decimal(row["salary_amount"]) / rate)


def expected_median(salaries: list[int]) -> int:
    # stdlib median is the independent reference; Decimal(str()) keeps the .5 exact.
    return round_half_up(Decimal(str(median(salaries))))


def expected_group_stats(salaries: list[int]) -> dict[str, int]:
    return {
        "count": len(salaries),
        "min": min(salaries),
        "max": max(salaries),
        "avg": round_half_up(Decimal(sum(salaries)) / len(salaries)),
        "median": expected_median(salaries),
    }


def group_salaries(rows: Rows, dimension: str, in_usd: bool) -> dict[str, list[int]]:
    groups: dict[str, list[int]] = defaultdict(list)
    for row in rows:
        salary = expected_usd_salary(row) if in_usd else row["salary_amount"]
        groups[row[dimension]].append(salary)
    return dict(groups)
