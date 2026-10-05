from pathlib import Path

from scripts.check_limits import CHECKED_DIRECTORIES, find_limit_violations


def write_function_of_length(directory: Path, line_count: int) -> Path:
    body = "    value = 1\n" * (line_count - 1)
    source_file = directory / "sample.py"
    source_file.write_text(f"def sample_function():\n{body}")
    return source_file


def test_find_limit_violations_reports_function_over_20_lines(tmp_path: Path) -> None:
    # Arrange
    write_function_of_length(tmp_path, 21)

    # Act
    violations = find_limit_violations([tmp_path])

    # Assert
    assert any("sample_function" in violation for violation in violations)


def test_find_limit_violations_accepts_function_of_exactly_20_lines(tmp_path: Path) -> None:
    # Arrange
    write_function_of_length(tmp_path, 20)

    # Act
    violations = find_limit_violations([tmp_path])

    # Assert
    assert violations == []


def test_find_limit_violations_finds_none_in_real_codebase() -> None:
    # Arrange
    directories = CHECKED_DIRECTORIES

    # Act
    violations = find_limit_violations(directories)

    # Assert
    assert violations == []
