from datetime import date, datetime

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(16), unique=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    # Indexed for search and the directory filters (D-007).
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    job_title: Mapped[str] = mapped_column(String(100), index=True)
    department: Mapped[str] = mapped_column(String(50), index=True)
    country: Mapped[str] = mapped_column(String(50), index=True)
    salary_amount: Mapped[int]
    salary_currency: Mapped[str] = mapped_column(String(3))
    hire_date: Mapped[date]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
