from collections import defaultdict

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import CaseStatus, Requirement, RequirementCoverage, TestCase, TestRun, TestSuite

router = APIRouter(tags=["graph"])


class TrendPoint(BaseModel):
    date: str
    passRate: float


class GraphDataOut(BaseModel):
    statusCounts: dict[str, int]
    trend: list[TrendPoint]
    coveragePercent: float | None


class TimelineRow(BaseModel):
    runId: int
    testCaseId: int
    testCaseTitle: str
    result: str
    buildVersion: str
    executedAt: str


def _suite_ids_for_test_type(session: Session, product_id: int, test_type_id: int) -> list[int]:
    suites = session.exec(
        select(TestSuite).where(TestSuite.product_id == product_id, TestSuite.test_type_id == test_type_id)
    ).all()
    return [s.id for s in suites]


@router.get("/api/products/{product_id}/test-types/{test_type_id}/graph-data", response_model=GraphDataOut)
def get_graph_data(product_id: int, test_type_id: int, session: Session = Depends(get_session)):
    suite_ids = _suite_ids_for_test_type(session, product_id, test_type_id)

    status_counts: dict[str, int] = {status.value: 0 for status in CaseStatus}
    cases: list[TestCase] = []
    if suite_ids:
        cases = session.exec(select(TestCase).where(TestCase.suite_id.in_(suite_ids))).all()
        for case in cases:
            status_counts[case.current_status.value] += 1

    case_ids = [c.id for c in cases]
    trend_buckets: dict[str, list[str]] = defaultdict(list)
    if case_ids:
        runs = session.exec(select(TestRun).where(TestRun.test_case_id.in_(case_ids))).all()
        for run in runs:
            date_key = run.executed_at.strftime("%Y-%m-%d")
            trend_buckets[date_key].append(run.result.value)

    trend = []
    for date_key in sorted(trend_buckets.keys()):
        results = trend_buckets[date_key]
        pass_rate = results.count("Pass") / len(results)
        trend.append(TrendPoint(date=date_key, passRate=pass_rate))

    requirements = session.exec(select(Requirement).where(Requirement.product_id == product_id)).all()
    coverage_percent: float | None = None
    if requirements:
        covered_count = 0
        for req in requirements:
            has_coverage = session.exec(
                select(RequirementCoverage).where(RequirementCoverage.requirement_id == req.id)
            ).first()
            if has_coverage is not None:
                covered_count += 1
        coverage_percent = round(covered_count / len(requirements) * 100, 2)

    return GraphDataOut(statusCounts=status_counts, trend=trend, coveragePercent=coverage_percent)


@router.get("/api/products/{product_id}/test-types/{test_type_id}/timeline", response_model=list[TimelineRow])
def get_test_type_timeline(product_id: int, test_type_id: int, session: Session = Depends(get_session)):
    suite_ids = _suite_ids_for_test_type(session, product_id, test_type_id)
    if not suite_ids:
        return []

    cases = session.exec(select(TestCase).where(TestCase.suite_id.in_(suite_ids))).all()
    case_by_id = {c.id: c for c in cases}
    case_ids = list(case_by_id.keys())
    if not case_ids:
        return []

    runs = session.exec(
        select(TestRun).where(TestRun.test_case_id.in_(case_ids)).order_by(TestRun.executed_at.desc())
    ).all()

    return [
        TimelineRow(
            runId=run.id,
            testCaseId=run.test_case_id,
            testCaseTitle=case_by_id[run.test_case_id].title,
            result=run.result.value,
            buildVersion=run.build_version,
            executedAt=run.executed_at.isoformat(),
        )
        for run in runs
    ]
