# JMeter integration (Increment 2g)

Theo TDD mục 7.2: JMeter push kết quả qua chính endpoint `POST /api/automation/results`
đã có sẵn (dùng chung với reporter của AIQA) — không cần sửa backend.

## Cài đặt (đã làm 1 lần trên máy này, xác nhận 2026-09-23)

Apache JMeter 5.6.3 tải từ `downloads.apache.org` (bản stable hiện tại, xác nhận qua
trang chính thức + sha512 checksum), giải nén vào `~/opt/jmeter`. Cần Java (đã có sẵn
OpenJDK 11 trên máy này).

## File trong thư mục này

- `qa-manager-load-test.jmx` — kịch bản mẫu: 5 thread × 3 loop, gọi lặp lại
  `GET /api/products` vào chính backend qa-testcase-manager (tự chứa, không cần target
  bên ngoài).
- `jmeter_reporter.py` — script hậu xử lý, đọc file `.jtl` JMeter xuất ra, convert về
  đúng JSON schema chung (TDD mục 5.12), POST lên `/api/automation/results` với
  `testTypeName="Performance Test"`.
- `test_jmeter_reporter.py` — unit test cho phần logic convert/build payload (TDD-first).

## Cách chạy

1. Backend qa-testcase-manager phải đang chạy (`localhost:8000`), lấy ApiKey của Product
   từ DB (giống cách AIQA đang dùng).

2. Chạy JMeter (`-n` = non-GUI, `-l` = xuất kết quả ra file JTL):

   ```bash
   ~/opt/jmeter/bin/jmeter -n -t qa-manager-load-test.jmx -l results.jtl
   ```

3. Push kết quả lên QA Test Case Manager:

   ```bash
   python3 jmeter_reporter.py results.jtl \
     --api-url http://127.0.0.1:8000 \
     --api-key <ApiKey> \
     --suite-name "Load Test - API Products"
   ```

4. Kiểm tra: mở tab "Performance Test" trong sidebar frontend, sẽ thấy Suite
   "Load Test - API Products" với các case tương ứng mỗi `label` JMeter, mỗi case có
   nhiều TestRun (1 run/lần lặp).

## Đã verify thật (2026-09-23)

Chạy `jmeter -n -t qa-manager-load-test.jmx -l results.jtl` thật vào backend đang chạy:
15 sample (5 thread × 3 loop), 0 lỗi. Push qua `jmeter_reporter.py` thật:
`{'suiteId': 11, 'suiteCreated': True, 'casesCreated': 1, 'casesUpdated': 14, 'runsCreated': 15}`.
Xác nhận qua API (`GET /api/products/1/test-types/4/suites`) và trực tiếp trên frontend
(Playwright) — suite + case + đủ 15 TestRun "Pass" hiện đúng dưới tab Performance Test.

## Ghi chú

- VSCode extension cho JMeter (đã bàn ở đầu session) tạm bỏ qua theo yêu cầu của anh
  ("tạm pass") — có thể quay lại sau nếu cần.
- Không thêm dependency mới cho backend; `jmeter_reporter.py` chỉ cần `requests`. Trên
  máy này `requests` nằm ở system Python (`/usr/lib/python3/dist-packages`), KHÔNG có
  trong `backend/.venv` (venv đó cô lập theo thiết kế) — chạy script này bằng `python3`
  hệ thống, không phải qua `source backend/.venv/bin/activate`.
