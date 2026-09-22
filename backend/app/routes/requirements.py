from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models import Requirement, RequirementCoverage

router = APIRouter(tags=["requirements"])


class LinkCaseIn(BaseModel):
    test_case_id: int


class TraceabilityRow(BaseModel):
    requirementId: int
    title: str
    caseIds: list[int]
    covered: bool


@router.get("/api/products/{product_id}/requirements", response_model=list[Requirement])
def list_requirements(product_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Requirement).where(Requirement.product_id == product_id)).all()


@router.post("/api/requirements", response_model=Requirement)
def create_requirement(requirement: Requirement, session: Session = Depends(get_session)):
    requirement.id = None
    session.add(requirement)
    session.commit()
    session.refresh(requirement)
    return requirement


@router.post("/api/requirements/{requirement_id}/link-case", response_model=RequirementCoverage)
def link_case(requirement_id: int, payload: LinkCaseIn, session: Session = Depends(get_session)):
    requirement = session.get(Requirement, requirement_id)
    if requirement is None:
        raise HTTPException(status_code=404, detail="Requirement not found")

    coverage = RequirementCoverage(requirement_id=requirement_id, test_case_id=payload.test_case_id)
    session.add(coverage)
    session.commit()
    session.refresh(coverage)
    return coverage


@router.get("/api/products/{product_id}/traceability-matrix", response_model=list[TraceabilityRow])
def traceability_matrix(product_id: int, session: Session = Depends(get_session)):
    requirements = session.exec(select(Requirement).where(Requirement.product_id == product_id)).all()

    rows: list[TraceabilityRow] = []
    for req in requirements:
        coverages = session.exec(
            select(RequirementCoverage).where(RequirementCoverage.requirement_id == req.id)
        ).all()
        case_ids = [c.test_case_id for c in coverages]
        rows.append(
            TraceabilityRow(requirementId=req.id, title=req.title, caseIds=case_ids, covered=len(case_ids) > 0)
        )

    return rows
