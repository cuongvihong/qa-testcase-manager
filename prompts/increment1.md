<!-- date: 2026-09-22 -->
## Context

Xây "Hệ thống Quản lý Test Case QA" — web app nội bộ, đơn người dùng, chạy localhost (Phase 1 theo FSD). Mục tiêu cốt lõi: đội QA quản lý Test Suite/Test Case tập trung theo Product/TestType, và nhận kết quả chạy test tự động từ công cụ automation (Playwright, JMeter) qua 1 REST API chung.

Nguồn: `~/learn/qa-testcase-manager/docs/FSD.md`, `docs/TDD.md`, 3 mockup đã duyệt trong `mockups/` (`Main.dc.html`, `Panel2-Timeline.dc.html`, `Panel2-Retry.dc.html`, xem bố cục qua `canvas.json`).

Nguồn test thật dùng để chứng minh tích hợp: project `~/AIQA` — bộ Playwright/pytest (143 test, form "Curricula Trainer Account"), có sẵn `conftest.py` với hook `pytest_runtest_makereport` lưu report vào `item.rep_{when}`, và hàm `get_suite_name()` map marker `tsNN` → mã suite.

## Deviation đã duyệt so với TDD

TDD gốc chọn backend Node/Express/TypeScript/Prisma. Đã đổi sang **Python/FastAPI + SQLModel** vì AIQA dùng pytest-playwright (Python) — không dùng được custom Reporter class kiểu Playwright Test (JS) như TDD mục 7.1 mô tả. Lý do đầy đủ + CHANGELOG ghi ở đầu `docs/TDD.md`.

## Task — Increment 1

**Trong phạm vi:**
1. DB schema SQLModel đủ 14 bảng theo TDD mục 4.2 (kể cả bảng Phase 2, chỉ tạo schema không xây route).
2. Backend FastAPI: CRUD Product / TestSuite / TestCase, endpoint Retry (`POST /api/cases/:id/retry`), endpoint Automation Ingest (`POST /api/automation/results`, đúng JSON schema TDD 5.12 + logic 6 bước xử lý).
3. Seed lúc khởi động: 1 User, 12 TestType cố định, 1 Product tên "Curricula Trainer Account", 1 ApiKey in ra console.
4. Frontend React + Vite + TS + Tailwind + Zustand (theo đúng convention `~/learn/devmind-frontend`): layout 3/4/3 đúng `Main.dc.html`, chỉ tab **Test Suite** (Panel 1) + tab **Status** (Panel 2) hoạt động thật, các tab còn lại có thể để placeholder tĩnh.
5. `~/AIQA/qa_reporter_plugin.py` — pytest plugin mới, hook `pytest_sessionfinish`, tái dùng `get_suite_name()` và `item.rep_call` có sẵn trong `conftest.py` (không copy lại logic), map kết quả sang schema TDD 5.12, POST tới `/api/automation/results`. Đọc `QA_MANAGER_API_URL`/`QA_MANAGER_API_KEY` từ `AIQA/.env` (tạo file mới), im lặng bỏ qua nếu thiếu biến môi trường (không phá test suite AIQA khi backend chưa chạy).

**Ngoài phạm vi (Backlog Increment sau):** UI cho Category/Graph/Timeline/Requirement/Report/Environment/Comments/Retry, JMeter integration, mọi route/logic Phase 2 (role, DeleteRequest, quản lý user).

## Constraints

- Backend serve static frontend build, 1 process/1 port ở chế độ "chạy thật" (đúng tinh thần TDD mục 3 + 8.1, chỉ đổi Node→Python).
- SQLite tại `backend/data/app.db`, không dùng Alembic ở Increment 1 (`SQLModel.metadata.create_all()` là đủ).
- Không sửa `conftest.py`/logic hiện có của AIQA ngoài việc thêm 1 file plugin mới + đăng ký trong `pytest.ini`.
- `~/learn/qa-testcase-manager` là git repo riêng (không gộp vào repo `~/learn` chung).
- TDD (test-driven-development skill) cho phần logic automation-ingest: viết test trước cho các case (tạo mới Suite/Case, cập nhật Case đã tồn tại, `isAutoCreated`).

## Expected output

- Chạy được backend (`uvicorn app.main:app`) + frontend dev server, layout khớp mockup Main khi so sánh trực tiếp.
- Chạy `cd ~/AIQA && python3 -m pytest tests/ -k ts01` với plugin bật → AIQA vẫn pass/fail đúng như cũ (không regression), đồng thời dữ liệu Suite/Case/TestRun xuất hiện thật trong DB mới, xác nhận qua API hoặc query SQLite trực tiếp.
- Sau khi xác nhận subset, chạy full 143 test AIQA với plugin bật, không tăng đáng kể thời gian chạy.
