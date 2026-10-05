from typing import Any


def build_employee_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "first_name": "Asha",
        "last_name": "Rao",
        "email": "asha.rao@acme.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary_amount": 2_400_000,
        "hire_date": "2021-04-01",
    }
    return payload | overrides
