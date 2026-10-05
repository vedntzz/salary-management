from typing import get_args

from app.schemas.employee import Country
from app.services.currency import CURRENCY_BY_COUNTRY


def test_currency_map_covers_every_supported_country() -> None:
    # Arrange
    supported_countries = set(get_args(Country))

    # Act
    mapped_countries = set(CURRENCY_BY_COUNTRY)

    # Assert
    assert mapped_countries == supported_countries
