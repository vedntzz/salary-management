from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db import Base, get_session
from app.main import app


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
