import csv
import io
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import DATA_DIR, get_session
from app.models import ReportExport, ReportFormat, TestCase, TestSuite

router = APIRouter(tags=["reports"])

REPORTS_DIR = DATA_DIR / "reports"


class ExportReportIn(BaseModel):
    product_id: int
    scope: str  # "Product" | "Suite"
    suite_id: int | None = None


@router.get("/api/products/{product_id}/reports", response_model=list[ReportExport])
def list_reports(product_id: int, session: Session = Depends(get_session)):
    return session.exec(select(ReportExport).where(ReportExport.product_id == product_id)).all()


@router.post("/api/reports/export", response_model=ReportExport)
def export_report(payload: ExportReportIn, session: Session = Depends(get_session)):
    suite_query = select(TestSuite).where(TestSuite.product_id == payload.product_id)
    if payload.scope == "Suite" and payload.suite_id is not None:
        suite_query = suite_query.where(TestSuite.id == payload.suite_id)
    suites = session.exec(suite_query).all()
    suite_ids = [s.id for s in suites]
    suite_name_by_id = {s.id: s.name for s in suites}

    cases: list[TestCase] = []
    if suite_ids:
        cases = session.exec(select(TestCase).where(TestCase.suite_id.in_(suite_ids))).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Suite", "Case", "Status"])
    for case in cases:
        writer.writerow([suite_name_by_id[case.suite_id], case.title, case.current_status.value])

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    file_path = REPORTS_DIR / f"report_{payload.product_id}_{timestamp}.csv"
    file_path.write_text(buffer.getvalue())

    report = ReportExport(
        product_id=payload.product_id,
        scope=payload.scope,
        format=ReportFormat.CSV,
        file_path=str(file_path),
    )
    session.add(report)
    session.commit()
    session.refresh(report)
    return report


@router.get("/api/reports/{report_id}/download")
def download_report(report_id: int, session: Session = Depends(get_session)):
    report = session.get(ReportExport, report_id)
    if report is None or report.file_path is None:
        raise HTTPException(status_code=404, detail="Report not found")

    content = Path(report.file_path).read_text()
    return Response(content=content, media_type="text/csv")
