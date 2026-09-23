# QA Test Case Manager

Web app quản lý test case, tích hợp nhận kết quả automation từ AIQA (Playwright/pytest)
và JMeter (load test). Xem `docs/FSD.md` + `docs/TDD.md` cho spec đầy đủ, `BACKLOG.md`
cho tiến độ Increment.

## Kiến trúc

- **Backend**: Python 3.10 / FastAPI / SQLModel (SQLite). 1 process serve cả API lẫn
  static frontend (xem `docs/TDD.md` CHANGELOG cho lý do đổi từ Node sang Python).
- **Frontend**: React 19 / Vite / TypeScript / Tailwind v4 / Zustand.

## Setup trên máy mới

**DB không được commit vào git** (`.gitignore` loại `backend/data/*.db`) — mỗi máy có
DB riêng, tự seed lại, tự tạo dữ liệu test thật bằng cách chạy AIQA/JMeter thật (xem
mục "Tạo lại dữ liệu test thật" bên dưới). 12 Test Type cố định (`FIXED_TEST_TYPES`
trong `backend/app/models.py`) tự động seed lại — không mất.

### Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
env -u PYTHONPATH .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Lần chạy đầu tiên tự seed (12 Test Type + 1 User admin + 1 Product mẫu + 1 ApiKey mới,
in ra console — lưu lại để dùng cho automation-ingest).

Lưu ý: nếu máy có `$PYTHONPATH` global trỏ vào nơi khác (vd ROS, Isaac Sim), luôn chạy
với `env -u PYTHONPATH` để venv không bị rò rỉ package hệ thống vào.

Chạy test: `env -u PYTHONPATH .venv/bin/python -m pytest tests/`

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173 (hoặc port Vite chọn)
```

Chạy test: `npm test` (vitest), `npm run test:e2e` (Playwright — cần backend đang chạy
ở `localhost:8000` và frontend dev server ở đúng port `playwright.config.ts` khai báo).

`localhost` chỉ truy cập được từ chính máy đang chạy 2 server này. Muốn mở từ máy khác
trong cùng mạng LAN, chạy `vite`/`uvicorn` với `--host 0.0.0.0` và dùng IP LAN của máy
chạy server.

## Tạo lại dữ liệu test thật (AIQA + JMeter)

Dữ liệu suite/case/run thật (không phải seed mẫu) tới từ 2 nguồn ngoài repo này:

1. **AIQA** (`~/AIQA`, repo riêng — Playwright/pytest, 143 test): có sẵn
   `qa_reporter_plugin.py` (`pytest_sessionfinish` hook) đọc `.env` (`QA_MANAGER_API_URL`,
   `QA_MANAGER_API_KEY` — lấy key từ log seed ở trên, hoặc `GET /api/products/1` rồi tra
   DB). Chạy `pytest` trong `~/AIQA` như bình thường, plugin tự đẩy kết quả sang backend
   này qua `POST /api/automation/results`.
2. **JMeter** (`jmeter/` trong repo này): xem `jmeter/README.md` — cần cài Apache JMeter
   riêng (không đi kèm repo, tải từ `downloads.apache.org`), chạy `.jmx` mẫu rồi
   `jmeter_reporter.py` để đẩy kết quả JTL sang cùng endpoint.

Không có snapshot DB nào được commit — đây là lựa chọn có chủ đích (2026-09-23, theo yêu
cầu): dữ liệu test thật nên tới từ chạy automation thật trên từng máy, không từ file
tĩnh dễ lỗi thời.
