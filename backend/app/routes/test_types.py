from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db import get_session
from app.models import TestType

router = APIRouter(prefix="/api/test-types", tags=["test-types"])


@router.get("", response_model=list[TestType])
def list_test_types(session: Session = Depends(get_session)):
    return session.exec(select(TestType).order_by(TestType.id)).all()
