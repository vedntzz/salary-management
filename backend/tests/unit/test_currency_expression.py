from sqlalchemy import literal, select
from sqlalchemy.orm import Session

from app.services.currency import build_usd_equivalent_expression


def evaluate_usd_equivalent(session: Session, amount: int, currency: str) -> object:
    expression = build_usd_equivalent_expression(literal(amount), literal(currency))
    return session.scalar(select(expression))


def test_usd_equivalent_expression_ranks_usd_salary_above_smaller_inr_value(
    session: Session,
) -> None:
    # Arrange
    usd_salary = evaluate_usd_equivalent(session, 150_000, "USD")

    # Act
    inr_salary = evaluate_usd_equivalent(session, 8_800_000, "INR")  # 100,000 USD

    # Assert
    assert usd_salary > inr_salary


def test_usd_equivalent_expression_ranks_larger_inr_value_above_usd_salary(
    session: Session,
) -> None:
    # Arrange
    usd_salary = evaluate_usd_equivalent(session, 90_000, "USD")

    # Act
    inr_salary = evaluate_usd_equivalent(session, 8_800_000, "INR")  # 100,000 USD

    # Assert
    assert inr_salary > usd_salary
