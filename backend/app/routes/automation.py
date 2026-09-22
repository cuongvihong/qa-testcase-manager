from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import ApiKey
from app.schemas import AutomationResultsPayload, IngestSummary
from app.services.automation_ingest import ingest_results

router = APIRouter(tags=["automation"])


def resolve_product_id(authorization: str | None, session: Session) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer ApiKey in Authorization header")

    key = authorization.removeprefix("Bearer ").strip()
    api_key = session.exec(select(ApiKey).where(ApiKey.key == key)).first()
    if api_key is None:
        raise HTTPException(status_code=401, detail="Invalid ApiKey")

    return api_key.product_id


@router.post("/api/automation/results", response_model=IngestSummary)
def push_automation_results(
    payload: AutomationResultsPayload,
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
):
    product_id = resolve_product_id(authorization, session)
    return ingest_results(session, product_id=product_id, payload=payload)
