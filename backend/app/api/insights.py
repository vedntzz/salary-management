from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_session
from app.schemas.insights import (
    DimensionPayStats,
    DimensionQuery,
    DistributionQuery,
    PayrollSummary,
    SalaryDistribution,
)
from app.services.insights_service import InsightsService, build_insights_service

router = APIRouter(prefix="/api/insights", tags=["insights"])


def get_insights_service(session: Annotated[Session, Depends(get_session)]) -> InsightsService:
    return build_insights_service(session)


InsightsServiceDependency = Annotated[InsightsService, Depends(get_insights_service)]


@router.get("/summary")
def read_payroll_summary(service: InsightsServiceDependency) -> PayrollSummary:
    return service.summarize_payroll()


@router.get("/by-dimension")
def read_pay_by_dimension(
    query: Annotated[DimensionQuery, Query()], service: InsightsServiceDependency
) -> DimensionPayStats:
    return service.compare_pay_by_dimension(query)


@router.get("/distribution")
def read_salary_distribution(
    query: Annotated[DistributionQuery, Query()], service: InsightsServiceDependency
) -> SalaryDistribution:
    return service.build_distribution(query)
