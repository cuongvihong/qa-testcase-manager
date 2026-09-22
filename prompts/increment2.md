<!-- date: 2026-09-22 -->
## Context

Increment 1 xong (backend CRUD + automation-ingest + tab Test Suite/Status, verify end-to-end với AIQA thật, 33 backend + 5 store + 11 E2E test pass). FSD mục 3 định nghĩa 8 tab Panel 1, mới có Test Suite. Panel 2 có 3 tab, mới có Status. Tiếp tục Backlog: 7 tab còn lại (trừ Comments — FSD mục 5.8 tự đánh dấu Phase 2, không làm), Retry UI, và JMeter.

## Deviation đã duyệt

- Category route TDD 5.7 (`GET /api/suites/:suiteId/categories`) vênh với mô tả FSD 5.2 (lọc theo module trong toàn bộ TestType) → sửa thành `GET /api/products/:id/test-types/:id/categories`.
- Report (TDD 5.9): chỉ làm CSV increment này, PDF/Excel để Increment 3.

## Task — 7 sub-phase, commit sau mỗi phase

1. **2a Timeline + Retry (Panel 2)** — UI thuần, dữ liệu đã có sẵn (`TestRun`, `retry_of_run_id`, endpoint retry đã hoạt động).
2. **2b Environment** — CRUD mới `routes/environments.py` (TDD-first) + UI list/form.
3. **2c Category** — route mới (theo route đã sửa), group theo `TestSuite.module` + UI filter client-side.
4. **2d Requirement + Traceability** — `routes/requirements.py` đầy đủ theo TDD 5.6/5.8 + UI + export CSV traceability matrix. Làm trước Graph vì Graph cần coverage %.
5. **2e Graph** — route aggregate mới + UI: bar chart Pass/Fail/Blocked/NotRun + trend line + coverage %, tự vẽ SVG (không thêm thư viện chart). Bỏ qua bug-by-severity (FSD ghi "nếu có bug tracking" — chưa có).
6. **2f Report (CSV)** — `POST /api/reports/export` + `GET /api/reports`, dùng bảng `ReportExport` đã có sẵn, file lưu `backend/data/reports/`.
7. **2g JMeter** — tải Apache JMeter 5.6.3 vào `~/opt/jmeter`, viết 1 file `.jmx` mẫu (GET vào chính backend) + script Python hậu xử lý đọc JTL → convert → POST `/api/automation/results` (`testTypeName="Performance Test"`), tái dùng endpoint có sẵn, không sửa backend. VSCode extension cho JMeter vẫn bỏ qua (anh đã chọn "tạm pass").

## Constraints

- TDD-first cho mọi route backend mới (red → green).
- Sau mỗi sub-phase: chạy lại pytest + vitest + Playwright E2E (mở rộng `e2e/main.spec.ts`), commit riêng.
- Không thêm dependency npm mới cho chart (tự vẽ SVG).
- Không làm Comments tab (Phase 2 theo FSD).

## Expected output

- 7 sub-phase hoàn thành, mỗi cái có test pass + commit riêng.
- JMeter chạy `.jmx` thật → script hậu xử lý push kết quả → xác nhận qua API có Suite mới dưới TestType "Performance Test" với TestRun thật.
