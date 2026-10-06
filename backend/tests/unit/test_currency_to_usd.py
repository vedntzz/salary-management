import pytest

from app.currency import convert_local_to_usd


def test_convert_local_to_usd_divides_by_fixed_rate_for_inr() -> None:
    # Arrange
    amount_inr = 8_800_000

    # Act
    amount_usd = convert_local_to_usd(amount_inr, "INR")

    # Assert
    assert amount_usd == 100_000
    assert isinstance(amount_usd, int)


def test_convert_local_to_usd_returns_same_amount_for_usd() -> None:
    # Arrange
    amount_local = 120_000

    # Act
    amount_usd = convert_local_to_usd(amount_local, "USD")

    # Assert
    assert amount_usd == 120_000


def test_convert_local_to_usd_rounds_half_up() -> None:
    # Arrange
    amount_inr = 44  # exactly 0.5 USD

    # Act
    amount_usd = convert_local_to_usd(amount_inr, "INR")

    # Assert
    assert amount_usd == 1


def test_convert_local_to_usd_rejects_unknown_currency() -> None:
    # Arrange
    amount_local = 50_000

    # Act / Assert
    with pytest.raises(ValueError):
        convert_local_to_usd(amount_local, "JPY")
