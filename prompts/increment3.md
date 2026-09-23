# Increment 3 — PDF + Excel Report Export

## Context

Increment 2f shipped CSV-only export for the Report tab (`POST /api/reports/export`, `GET /api/reports/{id}/download`), deferring PDF (`reportlab`) and Excel (`openpyxl`) per a TDD deviation recorded in `docs/TDD.md` CHANGELOG (2026-09-22). `ReportFormat` enum already has `PDF`/`EXCEL`/`CSV` members (`backend/app/models.py`); only CSV is wired end to end. This increment adds the other two.

## Scope

- Report content: same 3 columns as CSV today — Suite, Case, Status. No summary header, no extra metrics (approved: keep this increment tight).
- Backend: `ExportReportIn` gains a `format` field (`"CSV" | "PDF" | "Excel"`). `export_report` branches after building the existing `cases`/`suite_name_by_id` data — CSV path unchanged, new `_build_pdf()` (reportlab `SimpleDocTemplate` + `Table`) and `_build_excel()` (openpyxl `Workbook`, one sheet, header + rows) return bytes. `download_report` branches `media_type` and read mode (binary for PDF/xlsx, text for CSV) based on `report.format`.
- Frontend: `ReportTab.tsx` gets a format `<select>` (CSV/PDF/Excel) beside the scope picker; export button label reflects the chosen format; `exportReport(scope, suiteId, format)` in the Zustand store passes format through to the API call. History list already renders `report.format` — verify PDF/Excel entries display correctly, no code change expected there.
- Dependencies: `reportlab` + `openpyxl` added to `backend/requirements.txt`, installed into `backend/.venv` (approved by user 2026-09-23).

## Out of scope

- No summary/aggregate stats in the report body (deferred if ever requested).
- No new report scopes beyond the existing Product/Suite.
- No changes to the CSV path's behavior.

## Testing

- TDD-first (this project's established convention): extend the existing report backend tests with PDF/Excel cases — assert correct `ReportFormat` stored, non-empty binary content, correct magic bytes (`%PDF` for PDF, zip local-file-header `PK\x03\x04` for xlsx).
- Extend `e2e/main.spec.ts`: select PDF then Excel in the Report tab, trigger export, confirm a new history row with the correct format label and a working download link appears.
- Run full regression after: backend pytest, frontend vitest, Playwright E2E — all must stay green (mục 5 EVALUATION).

## Expected output

- `backend/requirements.txt` (+2 deps), `backend/app/routes/reports.py` (PDF/Excel branches), backend test file (new cases), `frontend/src/components/ReportTab.tsx` + store (format select wired), `e2e/main.spec.ts` (new assertions).
- Commit after implementation + all tests green, matching this project's per-increment commit discipline.
