from decimal import Decimal

from app.services.currency import CURRENCY_BY_COUNTRY, convert_usd_to_local

TITLES_BY_DEPARTMENT: dict[str, list[str]] = {
    "Engineering": [
        "Software Engineer",
        "Senior Software Engineer",
        "Staff Engineer",
        "Engineering Manager",
        "QA Engineer",
    ],
    "Product": ["Product Manager", "Senior Product Manager", "Product Designer"],
    "Sales": ["Sales Development Representative", "Account Executive", "Sales Manager"],
    "Marketing": ["Marketing Specialist", "Content Strategist", "Marketing Manager"],
    "Finance": ["Accountant", "Financial Analyst", "Finance Manager"],
    "People": ["Recruiter", "HR Generalist", "People Partner"],
}

USD_BAND_BY_TITLE: dict[str, tuple[int, int]] = {
    "Software Engineer": (90_000, 130_000),
    "Senior Software Engineer": (130_000, 180_000),
    "Staff Engineer": (180_000, 240_000),
    "Engineering Manager": (170_000, 230_000),
    "QA Engineer": (75_000, 110_000),
    "Product Manager": (110_000, 150_000),
    "Senior Product Manager": (150_000, 200_000),
    "Product Designer": (90_000, 135_000),
    "Sales Development Representative": (50_000, 70_000),
    "Account Executive": (80_000, 130_000),
    "Sales Manager": (120_000, 170_000),
    "Marketing Specialist": (60_000, 85_000),
    "Content Strategist": (65_000, 95_000),
    "Marketing Manager": (100_000, 145_000),
    "Accountant": (60_000, 85_000),
    "Financial Analyst": (75_000, 105_000),
    "Finance Manager": (115_000, 160_000),
    "Recruiter": (60_000, 90_000),
    "HR Generalist": (55_000, 80_000),
    "People Partner": (95_000, 135_000),
}

# Pay level relative to the US, applied in USD before converting to local currency.
COUNTRY_PAY_MULTIPLIER: dict[str, Decimal] = {
    "United States": Decimal("1.00"),
    "United Kingdom": Decimal("0.80"),
    "Germany": Decimal("0.85"),
    "Canada": Decimal("0.80"),
    "Australia": Decimal("0.85"),
    "Singapore": Decimal("0.80"),
    "India": Decimal("0.30"),
    "Brazil": Decimal("0.35"),
}


def convert_band_amount_to_local(amount_usd: int, country: str) -> int:
    adjusted_usd = int(Decimal(amount_usd) * COUNTRY_PAY_MULTIPLIER[country])
    return convert_usd_to_local(adjusted_usd, CURRENCY_BY_COUNTRY[country])


def salary_band_for(job_title: str, country: str) -> tuple[int, int]:
    low_usd, high_usd = USD_BAND_BY_TITLE[job_title]
    return (
        convert_band_amount_to_local(low_usd, country),
        convert_band_amount_to_local(high_usd, country),
    )
