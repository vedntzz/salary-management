from typing import get_args

import pytest

from app.schemas.employee import Country
from app.services.currency import CURRENCY_BY_COUNTRY, convert_usd_to_local


def test_currency_map_covers_every_supported_country() -> None:
    # Arrange
    supported_countries = set(get_args(Country))

    # Act
    mapped_countries = set(CURRENCY_BY_COUNTRY)

    # Assert
    assert mapped_countries == supported_countries


def test_convert_usd_to_local_returns_same_amount_for_usd() -> None:
    # Arrange
    amount_usd = 120_000

    # Act
    amount_local = convert_usd_to_local(amount_usd, "USD")

    # Assert
    assert amount_local == 120_000


def test_convert_usd_to_local_applies_fixed_rate_for_inr() -> None:
    # Arrange
    amount_usd = 100_000

    # Act
    amount_local = convert_usd_to_local(amount_usd, "INR")

    # Assert
    assert amount_local == 8_800_000


def test_convert_usd_to_local_rounds_to_whole_int_for_fractional_result() -> None:
    # Arrange
    amount_usd = 100_001  # 0.75 GBP per USD gives 75_000.75

    # Act
    amount_local = convert_usd_to_local(amount_usd, "GBP")

    # Assert
    assert amount_local == 75_001
    assert isinstance(amount_local, int)


@pytest.mark.parametrize("currency", sorted(set(CURRENCY_BY_COUNTRY.values())))
def test_convert_usd_to_local_supports_every_mapped_currency(currency: str) -> None:
    # Arrange
    amount_usd = 50_000

    # Act
    amount_local = convert_usd_to_local(amount_usd, currency)

    # Assert
    assert amount_local > 0


def test_convert_usd_to_local_rejects_unknown_currency() -> None:
    # Arrange
    amount_usd = 50_000

    # Act / Assert
    with pytest.raises(ValueError):
        convert_usd_to_local(amount_usd, "JPY")
