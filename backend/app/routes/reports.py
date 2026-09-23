import csv
import io
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from openpyxl import Workbook
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table
from sqlmodel import Session, select

from app.db import DATA_DIR, get_session
from app.models import ReportExport, ReportFormat, TestCase, TestSuite

router = APIRouter(tags=["reports"])

REPORTS_DIR = DATA_DIR / "reports"

_EXTENSION_BY_FORMAT = {
    ReportFormat.CSV: "csv",
    ReportFormat.PDF: "pdf",
    ReportFormat.EXCEL: "xlsx",
}

_MEDIA_TYPE_BY_FORMAT = {
    ReportFormat.CSV: "text/csv",
    ReportFormat.PDF: "application/pdf",
    ReportFormat.EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class ExportReportIn(BaseModel):
    product_id: int
    scope: str  # "Product" | "Suite"
    suite_id: int | None = None
    format: str = "CSV"  # "CSV" | "PDF" | "Excel"


def _build_csv_bytes(rows: list[list[str]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Suite", "Case", "Status"])
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def _build_pdf_bytes(rows: list[list[str]]) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    table_data = [["Suite", "Case", "Status"], *rows]
    doc.build([Table(table_data)])
    return buffer.getvalue()


def _build_excel_bytes(rows: list[list[str]]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["Suite", "Case", "Status"])
    for row in rows:
        sheet.append(row)
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


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

    rows = [
        [suite_name_by_id[case.suite_id], case.title, case.current_status.value] for case in cases
    ]

    report_format = ReportFormat(payload.format)
    if report_format == ReportFormat.PDF:
        content = _build_pdf_bytes(rows)
    elif report_format == ReportFormat.EXCEL:
        content = _build_excel_bytes(rows)
    else:
        content = _build_csv_bytes(rows)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    extension = _EXTENSION_BY_FORMAT[report_format]
    file_path = REPORTS_DIR / f"report_{payload.product_id}_{timestamp}.{extension}"
    file_path.write_bytes(content)

    report = ReportExport(
        product_id=payload.product_id,
        scope=payload.scope,
        format=report_format,
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

    content = Path(report.file_path).read_bytes()
    media_type = _MEDIA_TYPE_BY_FORMAT[report.format]
    return Response(content=content, media_type=media_type)
