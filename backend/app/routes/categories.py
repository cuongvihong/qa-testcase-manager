from collections import defaultdict

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import CaseStatus, TestCase, TestSuite

router = APIRouter(tags=["categories"])

UNASSIGNED_MODULE = "Chưa phân loại"


class CategoryOut(BaseModel):
    module: str
    suiteIds: list[int]
    caseCount: int
    passRate: float


@router.get("/api/products/{product_id}/test-types/{test_type_id}/categories", response_model=list[CategoryOut])
def list_categories(product_id: int, test_type_id: int, session: Session = Depends(get_session)):
    suites = session.exec(
        select(TestSuite).where(TestSuite.product_id == product_id, TestSuite.test_type_id == test_type_id)
    ).all()

    suite_ids_by_module: dict[str, list[int]] = defaultdict(list)
    for suite in suites:
        module = suite.module or UNASSIGNED_MODULE
        suite_ids_by_module[module].append(suite.id)

    result: list[CategoryOut] = []
    for module, suite_ids in suite_ids_by_module.items():
        cases = session.exec(select(TestCase).where(TestCase.suite_id.in_(suite_ids))).all()
        case_count = len(cases)
        pass_count = sum(1 for c in cases if c.current_status == CaseStatus.PASS)
        pass_rate = (pass_count / case_count) if case_count else 0.0
        result.append(CategoryOut(module=module, suiteIds=suite_ids, caseCount=case_count, passRate=pass_rate))

    return result
