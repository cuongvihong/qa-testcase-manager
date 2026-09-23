from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import Environment, TestCase, TestRun, TestSuite

router = APIRouter(tags=["cases"])


@router.get("/api/suites/{suite_id}/cases", response_model=list[TestCase])
def list_cases(suite_id: int, session: Session = Depends(get_session)):
    return session.exec(select(TestCase).where(TestCase.suite_id == suite_id)).all()


@router.get("/api/cases/{case_id}")
def get_case(case_id: int, session: Session = Depends(get_session)):
    case = session.get(TestCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    runs = session.exec(
        select(TestRun).where(TestRun.test_case_id == case_id).order_by(TestRun.executed_at.desc())
    ).all()

    env_ids = {r.environment_id for r in runs if r.environment_id is not None}
    env_names = {}
    if env_ids:
        envs = session.exec(select(Environment).where(Environment.id.in_(env_ids))).all()
        env_names = {e.id: e.name for e in envs}

    runs_out = [
        {**run.model_dump(), "environment_name": env_names.get(run.environment_id)} for run in runs
    ]
    return {"case": case, "runs": runs_out}


@router.post("/api/cases", response_model=TestCase)
def create_case(case: TestCase, session: Session = Depends(get_session)):
    case.id = None
    case.is_auto_created = False
    if "priority" not in case.model_fields_set:
        suite = session.get(TestSuite, case.suite_id)
        if suite is not None:
            case.priority = suite.priority
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


@router.put("/api/cases/{case_id}", response_model=TestCase)
def update_case(case_id: int, patch: TestCase, session: Session = Depends(get_session)):
    case = session.get(TestCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    for field in ("title", "description", "current_status", "priority", "execution_type", "script_path"):
        setattr(case, field, getattr(patch, field))
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


class CaseSearchRow(BaseModel):
    id: int
    title: str
    suite_id: int
    suite_name: str
    module: str
    priority: str
    current_status: str


@router.get(
    "/api/products/{product_id}/test-types/{test_type_id}/cases/search", response_model=list[CaseSearchRow]
)
def search_cases(
    product_id: int,
    test_type_id: int,
    q: str | None = None,
    priority: str | None = None,
    module: str | None = None,
    session: Session = Depends(get_session),
):
    suites = session.exec(
        select(TestSuite).where(TestSuite.product_id == product_id, TestSuite.test_type_id == test_type_id)
    ).all()
    suites_by_id = {s.id: s for s in suites}
    if module:
        suites_by_id = {sid: s for sid, s in suites_by_id.items() if s.module == module}
    if not suites_by_id:
        return []

    cases = session.exec(select(TestCase).where(TestCase.suite_id.in_(suites_by_id.keys()))).all()

    result: list[CaseSearchRow] = []
    for case in cases:
        if q and q.lower() not in case.title.lower():
            continue
        if priority and case.priority != priority:
            continue
        suite = suites_by_id[case.suite_id]
        result.append(
            CaseSearchRow(
                id=case.id,
                title=case.title,
                suite_id=suite.id,
                suite_name=suite.name,
                module=suite.module,
                priority=case.priority,
                current_status=case.current_status,
            )
        )
    return result


@router.delete("/api/cases/{case_id}")
def delete_case(case_id: int, session: Session = Depends(get_session)):
    case = session.get(TestCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    session.delete(case)
    session.commit()
    return {"ok": True}


@router.post("/api/cases/{case_id}/retry", response_model=TestRun)
def retry_case(case_id: int, session: Session = Depends(get_session)):
    case = session.get(TestCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    last_run = session.exec(
        select(TestRun).where(TestRun.test_case_id == case_id).order_by(TestRun.executed_at.desc())
    ).first()
    if last_run is None:
        raise HTTPException(status_code=400, detail="Case chưa từng có TestRun nào để retry")

    new_run = TestRun(
        test_case_id=case_id,
        result=last_run.result,
        build_version=last_run.build_version,
        environment_id=last_run.environment_id,
        retry_of_run_id=last_run.id,
    )
    session.add(new_run)
    session.commit()
    session.refresh(new_run)
    return new_run
