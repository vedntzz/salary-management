from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def build_connect_args(database_url: str) -> dict[str, object]:
    # FastAPI runs sync routes in a thread pool, and SQLite connections are thread-bound by default.
    return {"check_same_thread": False} if database_url.startswith("sqlite") else {}


engine = create_engine(
    settings.DATABASE_URL, connect_args=build_connect_args(settings.DATABASE_URL)
)
SessionLocal = sessionmaker(bind=engine)


def get_session() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session
