# TDD - Hệ thống Quản lý Test Case QA

Tài liệu này mô tả thiết kế kỹ thuật, dựa trên FSD đã được xác nhận. Giai đoạn hiện tại, hệ thống phục vụ một người dùng duy nhất, chạy trên máy cá nhân, localhost, không ưu tiên bảo mật cao. Các phần thiết kế liên quan đến nhiều người dùng, phân quyền Admin và Member, được giữ lại trong tài liệu này, đánh dấu rõ là Phase 2, tạm chưa triển khai, để dùng khi mở rộng cho khoảng 20 người dùng ở giai đoạn sau.

## CHANGELOG

**2026-09-22, Increment 2 — Category route corrected + Report scope trimmed**

- Mục 5.7: route Category viết sai phạm vi (`GET /api/suites/:suiteId/categories`, theo 1 suite), không khớp mô tả FSD mục 5.2 (Category lọc suite/case theo module trong toàn bộ loại test, cùng phạm vi với tab Test Suite). Route đúng: `GET /api/products/:productId/test-types/:testTypeId/categories`.
- Mục 5.9: Report Increment 2 chỉ xuất CSV (thư viện chuẩn Python, không thêm dependency). PDF (reportlab) và Excel (openpyxl) hoãn sang Increment 3.

**2026-09-22, Increment 1 — Deviation: Backend Node/Express/TS/Prisma → Python/FastAPI/SQLModel**

Lý do: nguồn dữ liệu automation-ingest chính (dự án `AIQA`, bộ test thật dùng để chứng minh tích hợp) dùng `pytest-playwright` (Python), không phải Playwright Test (JS) — không thể implement `Reporter` interface như mục 7.1 mô tả cho môi trường JS. Viết backend bằng Python để cùng hệ sinh thái với reporter/plugin phía nguồn test, tránh phải gọi chéo runtime JS↔Python cho một tác vụ vốn chỉ là gọi HTTP.

Thay đổi cụ thể, phần còn lại của TDD (kiến trúc 3 lớp, schema database mục 4, thiết kế API mục 5, luồng automation-ingest mục 5.12/7, SQLite, deploy Phase 1/2) giữ nguyên ý nghĩa, chỉ đổi runtime:
- Backend: Node/Express/TypeScript → **Python/FastAPI**
- ORM: Prisma → **SQLModel** (SQLAlchemy + Pydantic), không dùng Alembic ở Increment 1 (`SQLModel.metadata.create_all()` là đủ cho Phase 1 đơn người dùng)
- Mục 7.1 (Playwright Reporter class, package `qaweb-playwright-reporter`, `playwright.config.ts`) **thay bằng** pytest plugin Python (`qa_reporter_plugin.py`, hook `pytest_sessionfinish`) đặt trong chính project AIQA, không phải package npm cài vào `playwright.config.ts`
- Mục 3 (cấu trúc thư mục), mục 8.1 (1 process/1 port serve cả API lẫn static frontend) giữ nguyên ý nghĩa, FastAPI dùng `StaticFiles` thay Express `express.static`

## 1. Kiến trúc tổng thể

Hệ thống theo mô hình 3 lớp logic, đơn giản, không dùng microservices vì quy mô nhỏ.

- Frontend, ứng dụng React, Single Page Application, build ra file tĩnh, HTML, CSS, JS.
- Backend, Node.js, Express, TypeScript, cung cấp REST API, xử lý nghiệp vụ, xác thực, đồng thời serve luôn file tĩnh của Frontend đã build.
- Database, SQLite, truy cập qua Prisma ORM.
- Nguồn dữ liệu automation, Playwright và JMeter, gọi vào Backend qua REST API riêng, endpoint import kết quả.

Giai đoạn hiện tại, Frontend và Backend gộp chạy chung một process, một cổng duy nhất, ví dụ localhost cổng 3000. Trình duyệt tải giao diện và gọi API đều qua cùng một địa chỉ, không cần cấu hình CORS giữa 2 cổng riêng biệt. Cách chạy chi tiết theo mục 3.

Sơ đồ luồng dữ liệu tổng quát.

```
[Trình duyệt, React SPA đã build]
        |  HTTP, cùng cổng
        v
[Backend, Node.js Express, serve tĩnh + REST API]
        |  Prisma ORM
        v
[Database, SQLite]
        ^
        |  HTTP REST, JSON, API Key
[Playwright reporter]   [JMeter script hậu xử lý]
```

## 2. Lựa chọn công nghệ và lý do

- Backend, Node.js, Express, TypeScript. Lý do, hệ sinh thái JavaScript thuận tiện khi viết custom reporter cho Playwright, cùng ngôn ngữ với frontend giúp giảm chi phí bảo trì. TypeScript giúp phát hiện lỗi ngay lúc gõ code, đặc biệt hữu ích khi database có nhiều bảng liên kết với nhau, giảm rủi ro gõ sai tên trường hoặc sai kiểu dữ liệu, kể cả khi chỉ một người phát triển và có hỗ trợ từ công cụ AI.
- ORM, Prisma. Lý do, định nghĩa schema rõ ràng bằng file schema riêng, tự sinh migration, dễ đổi sang PostgreSQL sau này nếu cần scale mà không phải viết lại tầng truy cập dữ liệu.
- Database, SQLite. Lý do, Phase 1 chỉ một người dùng, không cần server database riêng, dễ backup vì chỉ là một file, phù hợp giai đoạn đầu. Vẫn tiếp tục phù hợp khi lên Phase 2 khoảng 20 người dùng, không ưu tiên bảo mật hay khả năng chịu tải lớn ở giai đoạn hiện tại.
- Frontend, React, Vite. Lý do, giao diện có nhiều panel động, tab ngang hàng, trạng thái chọn lồng nhau, Product, loại test, Suite, Case, React quản lý state tốt hơn nhiều so với HTML thuần.
- Deployment, Phase 1 chạy trực tiếp bằng npm trên máy cá nhân, không dùng Docker, để đơn giản hóa vận hành hàng ngày. Docker Compose dự kiến áp dụng lại ở Phase 2 khi chuyển sang VPS, giúp môi trường chạy nhất quán.

## 3. Cấu trúc thư mục dự án

```
project-root/
  backend/
    src/
      routes/
      controllers/
      services/
      middlewares/
      prisma/
        schema.prisma
      public/            (chứa file build của frontend, backend serve từ đây)
    package.json
  frontend/
    src/
      components/
      pages/
      store/
      api/
    package.json
    vite.config.ts       (cấu hình build output trỏ vào ../backend/src/public)
```

Cách chạy ở Phase 1, trên máy cá nhân, không dùng Docker.

1. Chạy `npm run build` trong thư mục frontend, sinh ra file tĩnh vào backend/src/public
2. Chạy `npm run start` trong thư mục backend, Express serve file tĩnh và API trên cùng một cổng, ví dụ localhost 3000
3. Trong lúc phát triển, có thể chạy frontend dev server riêng với hot reload, cấu hình proxy /api sang backend, chỉ dùng cho mục đích code, không dùng cho vận hành hàng ngày

## 4. Thiết kế Database

### 4.1 Danh sách bảng chính

- User, tài khoản người dùng, giai đoạn hiện tại chỉ có một bản ghi duy nhất
- Product, sản phẩm hoặc dự án
- ProductMember, Phase 2, tạm chưa dùng, quan hệ nhiều nhiều giữa User và Product
- TestType, 12 loại test cố định
- TestSuite, thuộc một Product và một TestType
- TestCase, thuộc một TestSuite
- TestRun, một lần chạy của một TestCase, chính là History
- Requirement, yêu cầu hoặc user story
- RequirementCoverage, quan hệ nhiều nhiều giữa Requirement và TestCase
- Environment, môi trường chạy test
- Comment, bình luận gắn vào Suite hoặc Case
- DeleteRequest, Phase 2, tạm chưa dùng, yêu cầu xóa do Member gửi, chờ Admin duyệt
- ApiKey, khóa dùng cho Playwright hoặc JMeter push kết quả
- ReportExport, lịch sử các báo cáo đã xuất

### 4.2 Mô tả chi tiết từng bảng

**User**
- id
- username, duy nhất
- password, lưu dạng có thể xem lại theo yêu cầu FSD mục 8.4, không mã hóa ở giai đoạn này
- displayName
- role, Admin hoặc Member, Phase 2, tạm chưa dùng, giai đoạn hiện tại mặc định một tài khoản duy nhất
- status, Active hoặc Locked
- createdAt

**Product**
- id
- name
- description
- ownerId, tham chiếu User
- createdAt

**ProductMember, Phase 2, tạm chưa dùng**
- id
- productId
- userId

**TestType**
- id
- name, một trong 12 loại cố định, Unit, Integration, UI, Performance, API, Regression, Smoke, Security, Compatibility, Usability, Load hoặc Stress, Acceptance

**TestSuite**
- id
- productId
- testTypeId
- name
- description
- module
- ownerId
- priority, High, Medium, Low
- status, Active, Deprecated, Draft
- createdAt
- updatedAt

**TestCase**
- id
- suiteId
- title
- description
- currentStatus, Not Run, In Progress, Pass, Fail, Blocked, Skipped
- isAutoCreated, boolean, đánh dấu case tự sinh từ automation
- createdAt
- updatedAt

**TestRun**
- id
- testCaseId
- executedBy, tham chiếu User, có thể null nếu chạy tự động từ automation
- result, Pass, Fail, Blocked, Skipped
- buildVersion
- environmentId
- errorNote
- bugTicketLink
- retryOfRunId, tham chiếu đến TestRun trước đó nếu đây là lần retry
- executedAt

**Requirement**
- id
- productId
- title
- description
- createdAt

**RequirementCoverage**
- id
- requirementId
- testCaseId

**Environment**
- id
- productId
- name, ví dụ Development, Staging, Production
- deviceInfo, tùy chọn, dùng cho UI Test và Compatibility Test

**Comment**
- id
- targetType, Suite hoặc Case
- targetId
- authorId
- content
- mentionUserId, tùy chọn, Phase 2, tạm chưa dùng
- isHidden, boolean
- createdAt

**DeleteRequest, Phase 2, tạm chưa dùng**
- id
- targetType, Suite hoặc Case
- targetId
- requestedBy
- status, Pending, Approved, Rejected
- reviewedBy
- createdAt
- reviewedAt

**ApiKey**
- id
- productId
- key, chuỗi ngẫu nhiên
- createdBy
- createdAt

**ReportExport**
- id
- productId
- scope, mô tả phạm vi báo cáo
- format, PDF, Excel, CSV
- exportedBy
- exportedAt
- filePath

## 5. Thiết kế API

### 5.1 Xác thực

- POST /api/auth/login, đăng nhập bằng username và password, trả về session token
- POST /api/auth/logout, đăng xuất

### 5.2 Quản lý người dùng, Phase 2, tạm chưa dùng, chỉ Admin

- GET /api/users, danh sách người dùng
- POST /api/users, tạo tài khoản mới
- PUT /api/users/:id, sửa thông tin, đổi vai trò, khóa mở khóa
- PUT /api/users/:id/reset-password, đặt lại mật khẩu

### 5.3 Product

- GET /api/products
- POST /api/products, chỉ Admin
- PUT /api/products/:id, chỉ Admin
- DELETE /api/products/:id, chỉ Admin

### 5.4 Test Suite

- GET /api/products/:productId/test-types/:testTypeId/suites
- POST /api/suites
- PUT /api/suites/:id
- DELETE /api/suites/:id, giai đoạn hiện tại xóa trực tiếp, Phase 2 sẽ thêm nhánh Member tạo DeleteRequest thay vì xóa ngay

### 5.5 Test Case

- GET /api/suites/:suiteId/cases
- GET /api/cases/:id, chi tiết Case, gồm Status, History, danh sách TestRun
- POST /api/cases
- PUT /api/cases/:id
- DELETE /api/cases/:id, giai đoạn hiện tại xóa trực tiếp, Phase 2 sẽ thêm nhánh Member tạo DeleteRequest thay vì xóa ngay
- POST /api/cases/:id/retry, tạo TestRun mới với retryOfRunId trỏ về lần chạy trước

### 5.6 Delete Request, Phase 2, tạm chưa dùng

- GET /api/delete-requests, danh sách chờ duyệt, chỉ Admin
- PUT /api/delete-requests/:id/approve
- PUT /api/delete-requests/:id/reject

### 5.7 Category, Graph, Timeline

- GET /api/suites/:suiteId/categories
- GET /api/test-types/:testTypeId/graph-data, trả về số liệu Pass, Fail, Blocked, Not Run, xu hướng theo thời gian, coverage
- GET /api/test-types/:testTypeId/timeline, danh sách các lần chạy theo thời gian

### 5.8 Requirement

- GET /api/products/:productId/requirements
- POST /api/requirements
- POST /api/requirements/:id/link-case, gắn Test Case vào Requirement
- GET /api/products/:productId/traceability-matrix

### 5.9 Report

- POST /api/reports/export, tạo báo cáo theo phạm vi, trả về file
- GET /api/reports, lịch sử báo cáo đã xuất

### 5.10 Environment

- GET /api/products/:productId/environments
- POST /api/environments
- PUT /api/environments/:id

### 5.11 Comment

- GET /api/comments, theo targetType và targetId
- POST /api/comments
- PUT /api/comments/:id/hide

### 5.12 Automation Ingest, dùng bởi Playwright và JMeter

- POST /api/automation/results, header Authorization Bearer ApiKey, body theo JSON schema chung

Cấu trúc JSON schema chung cho endpoint automation.

```
{
  "suiteName": "string",
  "testTypeName": "string",
  "cases": [
    {
      "title": "string",
      "result": "Pass | Fail | Blocked | Skipped",
      "durationMs": 0,
      "errorMessage": "string, tùy chọn",
      "buildVersion": "string",
      "environmentName": "string, tùy chọn"
    }
  ]
}
```

Logic xử lý phía Backend khi nhận request này.

1. Xác thực ApiKey, xác định Product tương ứng
2. Tìm hoặc tạo TestType theo testTypeName
3. Tìm Suite theo suiteName và productId, nếu không có thì tạo mới
4. Với mỗi case trong danh sách, tìm TestCase theo title và suiteId
5. Nếu tìm thấy, cập nhật currentStatus, tạo một TestRun mới
6. Nếu không tìm thấy, tạo TestCase mới với isAutoCreated bằng true, sau đó tạo TestRun

## 6. Thiết kế xác thực và phân quyền

- Dùng session đơn giản lưu qua cookie, HttpOnly, không dùng JWT vì không có yêu cầu về stateless hay scale nhiều server.
- Giai đoạn hiện tại, chỉ có một tài khoản duy nhất, mọi request đã đăng nhập đều được toàn quyền thao tác, không cần kiểm tra role hay kiểm tra thuộc Product nào.
- Phase 2, tạm chưa dùng, khi có nhiều người dùng, bổ sung middleware requireAdmin, chặn các route quản lý User, Product, duyệt DeleteRequest, và middleware requireProductMember, kiểm tra User có thuộc Product đang thao tác hay không, dựa trên bảng ProductMember.
- Mật khẩu lưu dạng có thể xem lại theo yêu cầu tại FSD mục 10, không áp dụng mã hóa một chiều ở giai đoạn này, ghi chú rõ đây là nợ kỹ thuật cần xử lý khi mở rộng hệ thống.

## 7. Tích hợp Playwright và JMeter

### 7.1 Playwright

Xây dựng một package nội bộ, ví dụ đặt tên qaweb-playwright-reporter, implement interface Reporter của Playwright. Khi test suite chạy xong, reporter tổng hợp kết quả từng test, map về đúng JSON schema chung tại mục 5.12, gọi POST đến /api/automation/results.

Cấu hình trong playwright.config.ts.

```
reporter: [
  ['./node_modules/qaweb-playwright-reporter', { apiUrl: '...', apiKey: '...', testTypeName: 'UI Test' }]
]
```

### 7.2 JMeter

Dùng Backend Listener có sẵn của JMeter, hoặc một script hậu xử lý, ví dụ Python, chạy sau bước JMeter trong pipeline CI CD. Script đọc file kết quả JTL hoặc CSV do JMeter xuất ra, convert về đúng JSON schema chung, gọi POST đến /api/automation/results với testTypeName là Performance Test hoặc Load hoặc Stress Test tùy loại kịch bản.

## 8. Kiến trúc triển khai

### 8.1 Phase 1, chạy local trên máy cá nhân

- Không dùng Docker, chạy trực tiếp Node.js đã cài trên máy.
- Một process Backend duy nhất, serve API và file tĩnh Frontend, một cổng, ví dụ localhost 3000.
- File database SQLite đặt tại một thư mục cố định ngoài source code, ví dụ project-root/data/app.db, để tránh mất dữ liệu khi build lại hoặc cập nhật code.
- Backup, copy tay hoặc lên lịch script copy file app.db sang nơi khác định kỳ.
- Playwright và JMeter chạy trên cùng máy, gọi thẳng http://localhost:3000/api/automation/results.

### 8.2 Phase 2, đa người dùng, tạm chưa áp dụng, deploy public trên VPS

- Một VPS đơn, cài Docker và Docker Compose.
- Container backend, chạy Node.js Express, expose port nội bộ.
- Container frontend, build tĩnh bằng Vite, serve qua Nginx, đồng thời Nginx làm reverse proxy chuyển tiếp các request /api sang container backend.
- File database SQLite được mount ra ngoài container, qua volume, để backup định kỳ bằng cách copy file.
- Không cần cân bằng tải hay nhiều instance, vì quy mô 20 người dùng.

#### 8.2.1 Domain, HTTPS và khả năng truy cập công khai

Hệ thống được publish với một tên miền thật, ví dụ qatestmanager.example.com, trỏ về VPS, không chạy dạng chỉ truy cập nội bộ hay localhost. Cấu hình chứng chỉ SSL, ví dụ qua Let's Encrypt, để chạy HTTPS.

#### 8.2.2 Ghi chú về khả năng xuất hiện trên Google Search

Google chỉ lập chỉ mục, index, được nội dung công khai, không yêu cầu đăng nhập. Vì phần nghiệp vụ chính của hệ thống, Test Suite, Test Case, Report, đều nằm sau màn hình Login, Google sẽ không thể index được các trang này, đây là nguyên tắc chung để bảo vệ dữ liệu, không phụ thuộc vào cách triển khai.

Phần có thể xuất hiện trên Google Search chỉ là các trang công khai, không yêu cầu đăng nhập, ví dụ trang chủ giới thiệu hệ thống hoặc trang Login. Với các trang này, áp dụng cấu hình SEO cơ bản.

- Thẻ title, meta description cho từng trang công khai
- File robots.txt, cho phép Googlebot truy cập các trang công khai
- File sitemap.xml, liệt kê các trang công khai
- Trang chủ và trang Login render nội dung tĩnh, không phụ thuộc hoàn toàn vào JavaScript, để công cụ tìm kiếm dễ đọc nội dung

## 9. Yêu cầu phi chức năng

- Hiệu năng, Phase 1 chỉ phục vụ một người dùng, không có yêu cầu đặc biệt về hiệu năng. Phase 2, đa người dùng, tạm chưa áp dụng, cần đáp ứng tốt cho tối đa khoảng 20 người dùng đồng thời, không cần tối ưu cho tải lớn.
- Bảo mật, không phải ưu tiên ở giai đoạn hiện tại theo xác nhận tại FSD, các hạng mục như mã hóa mật khẩu, giới hạn quyền truy cập chặt chẽ hơn, chống tấn công cơ bản, sẽ được đưa vào giai đoạn phát triển sau.
- Backup, backup thủ công hoặc lên lịch định kỳ bằng cách copy file SQLite.
- Khả năng mở rộng, cấu trúc dùng Prisma ORM giúp việc chuyển sang PostgreSQL sau này không yêu cầu viết lại toàn bộ tầng truy cập dữ liệu, thuận tiện khi chuyển từ Phase 1 sang Phase 2.
