import pytest

from app.services.statistics import build_salary_histogram, calculate_median_salary


def test_median_returns_middle_value_for_odd_count() -> None:
    # Arrange
    salaries = [300, 100, 200]

    # Act
    median = calculate_median_salary(salaries)

    # Assert
    assert median == 200


def test_median_returns_mean_of_two_middle_values_for_even_count() -> None:
    # Arrange
    salaries = [400, 100, 300, 200]

    # Act
    median = calculate_median_salary(salaries)

    # Assert
    assert median == 250


def test_median_rounds_half_up_for_even_count() -> None:
    # Arrange
    salaries = [100, 201]  # mean is 150.5

    # Act
    median = calculate_median_salary(salaries)

    # Assert
    assert median == 151
    assert isinstance(median, int)


def test_median_returns_the_value_for_single_salary() -> None:
    # Arrange
    salaries = [75_000]

    # Act
    median = calculate_median_salary(salaries)

    # Assert
    assert median == 75_000


def test_median_rejects_empty_list() -> None:
    # Arrange
    salaries: list[int] = []

    # Act / Assert
    with pytest.raises(ValueError):
        calculate_median_salary(salaries)


def test_histogram_counts_sum_to_total_salaries() -> None:
    # Arrange
    salaries = [30_000, 45_000, 52_000, 61_000, 75_000, 88_000, 120_000]

    # Act
    histogram = build_salary_histogram(salaries, bins=4)

    # Assert
    assert len(histogram) == 4
    assert sum(salary_bin.count for salary_bin in histogram) == len(salaries)


def test_histogram_puts_min_and_max_in_first_and_last_bin() -> None:
    # Arrange
    salaries = [0, 50, 50, 50, 100]

    # Act
    histogram = build_salary_histogram(salaries, bins=4)

    # Assert
    assert [salary_bin.count for salary_bin in histogram] == [1, 0, 3, 1]
    assert histogram[0].lower_bound == 0
    assert histogram[-1].upper_bound == 100


def test_histogram_handles_all_equal_salaries() -> None:
    # Arrange
    salaries = [70_000, 70_000, 70_000]

    # Act
    histogram = build_salary_histogram(salaries, bins=5)

    # Assert
    assert [salary_bin.count for salary_bin in histogram if salary_bin.count] == [3]
