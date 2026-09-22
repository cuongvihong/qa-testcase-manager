from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import TestSuite

router = APIRouter(tags=["suites"])


@router.get("/api/products/{product_id}/test-types/{test_type_id}/suites", response_model=list[TestSuite])
def list_suites(product_id: int, test_type_id: int, session: Session = Depends(get_session)):
    return session.exec(
        select(TestSuite).where(TestSuite.product_id == product_id, TestSuite.test_type_id == test_type_id)
    ).all()


@router.post("/api/suites", response_model=TestSuite)
def create_suite(suite: TestSuite, session: Session = Depends(get_session)):
    suite.id = None
    session.add(suite)
    session.commit()
    session.refresh(suite)
    return suite


@router.put("/api/suites/{suite_id}", response_model=TestSuite)
def update_suite(suite_id: int, patch: TestSuite, session: Session = Depends(get_session)):
    suite = session.get(TestSuite, suite_id)
    if suite is None:
        raise HTTPException(status_code=404, detail="Suite not found")
    for field in ("name", "description", "module", "priority", "status"):
        setattr(suite, field, getattr(patch, field))
    session.add(suite)
    session.commit()
    session.refresh(suite)
    return suite


@router.delete("/api/suites/{suite_id}")
def delete_suite(suite_id: int, session: Session = Depends(get_session)):
    suite = session.get(TestSuite, suite_id)
    if suite is None:
        raise HTTPException(status_code=404, detail="Suite not found")
    session.delete(suite)
    session.commit()
    return {"ok": True}
