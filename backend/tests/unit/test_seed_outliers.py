from collections import Counter
from typing import Any

from seed.salary_bands import salary_band_for
from seed.seed import generate_employees
from tests.salary_band_checks import classify_salary_against_band

SEED = 42
COUNT = 1_000
FIRST_NAMES = ["Asha", "Liam", "Mei", "Omar", "Sofia"]
LAST_NAMES = ["Rao", "Smith", "Chen", "Haddad", "Silva"]


def generate_thousand_employees() -> list[dict[str, Any]]:
    return generate_employees(FIRST_NAMES, LAST_NAMES, count=COUNT, seed=SEED)


def count_band_positions(rows: list[dict[str, Any]]) -> Counter[str]:
    return Counter(classify_salary_against_band(row) for row in rows)


def is_inside_band(row: dict[str, Any]) -> bool:
    low, high = salary_band_for(row["job_title"], row["country"])
    return low <= row["salary_amount"] <= high


def test_generate_employees_plants_between_half_and_two_percent_outliers() -> None:
    # Arrange
    rows = generate_thousand_employees()

    # Act
    out_of_band = [row for row in rows if not is_inside_band(row)]

    # Assert
    assert 5 <= len(out_of_band) <= 20


def test_generate_employees_places_every_outlier_in_a_planted_range() -> None:
    # Arrange
    rows = generate_thousand_employees()

    # Act
    positions = count_band_positions(rows)

    # Assert
    assert positions["unexpected"] == 0


def test_generate_employees_splits_outliers_roughly_evenly_above_and_below() -> None:
    # Arrange
    rows = generate_thousand_employees()

    # Act
    positions = count_band_positions(rows)
    above, below = positions["planted_above"], positions["planted_below"]

    # Assert
    total = above + below
    assert total > 0
    assert 0.3 * total <= above <= 0.7 * total


def test_generate_employees_keeps_below_band_outliers_positive() -> None:
    # Arrange
    rows = generate_thousand_employees()

    # Act
    below = [row for row in rows if classify_salary_against_band(row) == "planted_below"]

    # Assert
    assert below != []
    assert all(row["salary_amount"] > 0 for row in below)


def test_generate_employees_returns_identical_outliers_for_same_seed() -> None:
    # Arrange
    first_run = generate_thousand_employees()

    # Act
    second_run = generate_thousand_employees()

    # Assert
    assert first_run == second_run
