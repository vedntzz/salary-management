from decimal import Decimal
from typing import Any

from fastapi.testclient import TestClient

from app.currency import LOCAL_UNITS_PER_USD
from tests.factories import build_employee_payload

Rows = list[dict[str, Any]]


def list_employees(api_client: TestClient, **params: Any) -> dict[str, Any]:
    response = api_client.get("/api/employees", params=params)
    assert response.status_code == 200
    return response.json()


def matches_search(row: dict[str, Any], term: str) -> bool:
    searchable = (row["first_name"], row["last_name"], row["email"], row["employee_code"])
    return any(term.lower() in value.lower() for value in searchable)


def test_list_employees_returns_items_total_page_and_page_size(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"page": 1, "page_size": 10}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    assert set(body) == {"items", "total", "page", "page_size"}
    assert (body["total"], body["page"], body["page_size"]) == (len(seeded_employees), 1, 10)
    assert len(body["items"]) == 10


def test_list_employees_finds_code_regardless_of_case(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    term = "emp-00007"

    # Act
    body = list_employees(api_client, search=term)

    # Assert
    assert [item["employee_code"] for item in body["items"]] == ["EMP-00007"]


def test_list_employees_searches_name_and_email_regardless_of_case(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    term = "SMITH"
    expected_codes = {r["employee_code"] for r in seeded_employees if matches_search(r, term)}

    # Act
    body = list_employees(api_client, search=term, page_size=100)

    # Assert
    assert expected_codes
    assert {item["employee_code"] for item in body["items"]} == expected_codes
    assert body["total"] == len(expected_codes)


def test_list_employees_combines_filters_with_and(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    first = seeded_employees[0]
    filters = {"country": first["country"], "department": first["department"]}
    expected_codes = {
        row["employee_code"]
        for row in seeded_employees
        if all(row[field] == value for field, value in filters.items())
    }

    # Act
    body = list_employees(api_client, **filters, page_size=100)

    # Assert
    assert {item["employee_code"] for item in body["items"]} == expected_codes
    assert body["total"] == len(expected_codes)


def test_list_employees_filters_by_job_title(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    job_title = seeded_employees[0]["job_title"]
    expected_count = sum(1 for row in seeded_employees if row["job_title"] == job_title)

    # Act
    body = list_employees(api_client, job_title=job_title, page_size=100)

    # Assert
    assert {item["job_title"] for item in body["items"]} == {job_title}
    assert body["total"] == expected_count


def test_list_employees_sorts_by_usd_equivalent_salary_descending(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"sort": "-salary", "page_size": 100}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    usd_salaries = [
        Decimal(item["salary_amount"]) / LOCAL_UNITS_PER_USD[item["salary_currency"]]
        for item in body["items"]
    ]
    assert usd_salaries == sorted(usd_salaries, reverse=True)


def test_list_employees_sorts_by_hire_date_ascending(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"sort": "hire_date", "page_size": 100}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    hire_dates = [item["hire_date"] for item in body["items"]]
    assert hire_dates == sorted(hire_dates)


def test_list_employees_sorts_by_name_as_last_then_first(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"sort": "name", "page_size": 100}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    names = [(item["last_name"], item["first_name"]) for item in body["items"]]
    assert names == sorted(names)


def test_list_employees_sorts_by_name_descending(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"sort": "-name", "page_size": 100}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    names = [(item["last_name"], item["first_name"]) for item in body["items"]]
    assert names == sorted(names, reverse=True)


def test_list_employees_page_two_does_not_repeat_page_one(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    first_page = list_employees(api_client, sort="-salary", page=1, page_size=20)

    # Act
    second_page = list_employees(api_client, sort="-salary", page=2, page_size=20)

    # Assert
    first_ids = {item["id"] for item in first_page["items"]}
    second_ids = {item["id"] for item in second_page["items"]}
    assert len(second_ids) == 20
    assert first_ids.isdisjoint(second_ids)


def test_list_employees_caps_page_size_at_100(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"page_size": 500}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    assert body["page_size"] == 100


def test_list_employees_ranks_salary_by_usd_equivalent_when_sorting_descending(
    api_client: TestClient,
) -> None:
    # Arrange
    api_client.post("/api/employees", json=build_employee_payload(
        email="india@acme.com", country="India", salary_amount=8_800_000
    ))  # 100,000 USD at the fixed rate
    api_client.post("/api/employees", json=build_employee_payload(
        email="us@acme.com", country="United States", salary_amount=150_000
    ))

    # Act
    body = list_employees(api_client, sort="-salary")

    # Assert
    assert [item["email"] for item in body["items"]] == ["us@acme.com", "india@acme.com"]


def test_list_employees_breaks_name_ties_by_id(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    params = {"sort": "name", "page_size": 100}

    # Act
    body = list_employees(api_client, **params)

    # Assert
    keys = [(item["last_name"], item["first_name"], item["id"]) for item in body["items"]]
    assert keys == sorted(keys)


def test_list_employees_name_sorted_pages_never_overlap(
    api_client: TestClient, seeded_employees: Rows
) -> None:
    # Arrange
    pages = [
        list_employees(api_client, sort="name", page=page, page_size=20)["items"]
        for page in (1, 2, 3)
    ]

    # Act
    ids = [item["id"] for page in pages for item in page]

    # Assert
    assert len(ids) == len(seeded_employees)
    assert len(set(ids)) == len(ids)
