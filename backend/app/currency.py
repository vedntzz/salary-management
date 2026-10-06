from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import ColumnElement, case

CURRENCY_BY_COUNTRY: dict[str, str] = {
    "United States": "USD",
    "United Kingdom": "GBP",
    "India": "INR",
    "Germany": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Singapore": "SGD",
    "Brazil": "BRL",
}

# Approximate rates, fixed on purpose so reports and tests are deterministic (D-003).
RATES_AS_OF = date(2026, 10, 1)
LOCAL_UNITS_PER_USD: dict[str, Decimal] = {
    "USD": Decimal("1"),
    "GBP": Decimal("0.75"),
    "INR": Decimal("88"),
    "EUR": Decimal("0.86"),
    "CAD": Decimal("1.38"),
    "AUD": Decimal("1.52"),
    "SGD": Decimal("1.29"),
    "BRL": Decimal("5.40"),
}


def convert_usd_to_local(amount_usd: int, currency: str) -> int:
    if currency not in LOCAL_UNITS_PER_USD:
        raise ValueError(f"Unsupported currency: {currency}")
    amount_local = Decimal(amount_usd) * LOCAL_UNITS_PER_USD[currency]
    return int(amount_local.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def build_usd_equivalent_expression(
    amount: ColumnElement[int], currency: ColumnElement[str]
) -> ColumnElement[float]:
    # Float division is for ORDER BY only; it is never stored or returned (D-004 exception).
    rate = case({code: float(rate) for code, rate in LOCAL_UNITS_PER_USD.items()}, value=currency)
    return amount / rate
