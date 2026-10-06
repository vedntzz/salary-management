from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base, get_session
from app.main import app
from seed.seed import generate_employees, seed_employees

SEEDED_EMPLOYEE_COUNT = 50
SEED_FIRST_NAMES = ["Asha", "Liam", "Mei", "Omar", "Sofia", "Kenji"]
SEED_LAST_NAMES = ["Rao", "Smith", "Chen", "Haddad", "Silva", "Muller"]


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def session() -> Iterator[Session]:
    from app.models import employee  # noqa: F401  registers the table on Base.metadata

    # StaticPool keeps one connection, so the in-memory database survives across the test.
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    with Session(engine) as db_session:
        yield db_session
    engine.dispose()


@pytest.fixture
def api_client(session: Session) -> Iterator[TestClient]:
    # Routes share the test's in-memory session, so tests can arrange data through the API.
    app.dependency_overrides[get_session] = lambda: session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_employees(session: Session) -> list[dict[str, Any]]:
    rows = generate_employees(
        SEED_FIRST_NAMES, SEED_LAST_NAMES, count=SEEDED_EMPLOYEE_COUNT, seed=42
    )
    seed_employees(session, rows)
    return rows
