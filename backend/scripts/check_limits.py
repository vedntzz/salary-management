import ast
import sys
from pathlib import Path

MAX_FUNCTION_LINES = 20
MAX_FILE_LINES = 200
BACKEND_ROOT = Path(__file__).resolve().parent.parent
CHECKED_DIRECTORIES = [BACKEND_ROOT / name for name in ("app", "seed", "scripts")]


def find_long_functions(source_file: Path) -> list[str]:
    tree = ast.parse(source_file.read_text(), filename=str(source_file))
    violations = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef | ast.AsyncFunctionDef):
            length = node.end_lineno - node.lineno + 1
            if length > MAX_FUNCTION_LINES:
                violations.append(f"{source_file}:{node.lineno} {node.name} has {length} lines")
    return violations


def find_long_file(source_file: Path) -> list[str]:
    length = len(source_file.read_text().splitlines())
    if length > MAX_FILE_LINES:
        return [f"{source_file} has {length} lines"]
    return []


def find_limit_violations(directories: list[Path]) -> list[str]:
    violations = []
    for directory in directories:
        for source_file in sorted(directory.rglob("*.py")):
            violations += find_long_file(source_file) + find_long_functions(source_file)
    return violations


def main() -> int:
    violations = find_limit_violations(CHECKED_DIRECTORIES)
    for violation in violations:
        print(violation)
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
