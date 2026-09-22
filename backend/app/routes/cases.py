from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import TestCase, TestRun

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
    return {"case": case, "runs": runs}


@router.post("/api/cases", response_model=TestCase)
def create_case(case: TestCase, session: Session = Depends(get_session)):
    case.id = None
    case.is_auto_created = False
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


@router.put("/api/cases/{case_id}", response_model=TestCase)
def update_case(case_id: int, patch: TestCase, session: Session = Depends(get_session)):
    case = session.get(TestCase, case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")
    for field in ("title", "description", "current_status"):
        setattr(case, field, getattr(patch, field))
    session.add(case)
    session.commit()
    session.refresh(case)
    return case


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
