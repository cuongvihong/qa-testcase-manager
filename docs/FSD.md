# FSD - Hệ thống Quản lý Test Case QA

## 1. Tổng quan và mục tiêu

Xây dựng một hệ thống web nội bộ giúp đội QA quản lý tập trung toàn bộ test case theo từng loại kiểm thử, theo dõi trạng thái thực thi, lịch sử chạy test, đồng thời cho phép nhận kết quả tự động từ các công cụ automation như Playwright và JMeter.

Lưu ý về phạm vi hiện tại, giai đoạn 1 của hệ thống phục vụ một người dùng duy nhất, chạy trên máy cá nhân, localhost. Các tính năng liên quan đến nhiều người dùng, phân quyền, cộng tác nhóm, được thiết kế sẵn trong tài liệu này nhưng tạm chưa áp dụng, đánh dấu rõ ở từng mục và tổng hợp tại mục 11, để mở rộng khi hệ thống dùng cho khoảng 20 người dùng ở giai đoạn sau.

## 2. Đối tượng sử dụng và vai trò

**Giai đoạn hiện tại, đơn người dùng:** chỉ có một tài khoản duy nhất, đóng vai trò Admin, toàn quyền thao tác, không cần phân biệt vai trò.

**Phase 2, đa người dùng, tạm chưa áp dụng:** khi mở rộng cho nhiều người dùng, hệ thống dự kiến có 2 vai trò.

- Admin: toàn quyền, bao gồm quản lý tài khoản người dùng, tạo, sửa, xóa Test Suite và Test Case, xem toàn bộ báo cáo, cấu hình API Key cho tích hợp automation, phê duyệt yêu cầu xóa từ Member.
- Member: thực thi test case, cập nhật status, xem lịch sử, dùng chức năng retry, tạo và sửa Test Suite hoặc Test Case. Member có thể gửi yêu cầu xóa Suite hoặc Case, nhưng thao tác xóa chỉ hoàn tất sau khi Admin phê duyệt.

## 3. Kiến trúc giao diện tổng thể

Giao diện chia làm 4 lớp chính.

- Trên cùng, chọn Product, sản phẩm hoặc dự án đang được kiểm thử. Đây là tập cha, xác định ngữ cảnh cho toàn bộ dữ liệu bên dưới, mỗi Product có sidebar loại test, Suite, Case, dữ liệu riêng biệt.
- Sidebar bên trái, dạng danh sách cuộn dọc, liệt kê các loại test thuộc Product đang chọn.
- Khi chọn một loại test, panel bên phải hiện ra với 8 mục ngang hàng nhau, Test Suite, Category, Graph, Timeline, Requirement, Report, Environment, Comments.
- Trong tab Test Suite, panel 1 chỉ hiển thị danh sách tên Suite. Click vào một Suite, panel 1 hiển thị thêm danh sách tiêu đề Test Case thuộc Suite đó. Panel 2 hiển thị thông tin chi tiết, chi tiết Suite khi click vào Suite, hoặc chi tiết Case, gồm Status, History, Retry, khi click vào một Test Case.

Tỷ lệ chia vùng hiển thị trên màn hình theo lưới 10 cột như sau.

- Sidebar loại test, chiếm 3 phần
- Panel đầu, Test Suite, Category, Graph, Timeline, chiếm 4 phần
- Panel chi tiết Test Case, Status, History, Retry, chiếm 3 phần

Khi panel chi tiết Test Case chưa mở, panel đầu có thể giãn rộng hơn để tận dụng khoảng trống, tỷ lệ 3 phần sidebar và 7 phần panel đầu.

## 4. Product và danh sách loại Test ở sidebar

### 4.1 Product

Product là tập cha, đại diện cho sản phẩm hoặc dự án đang được kiểm thử, ví dụ Website Bán Hàng, Ứng Dụng Mobile, Hệ Thống Nội Bộ. Người dùng chọn một Product trước, sau đó mọi loại test, Suite, Case hiển thị bên dưới đều thuộc Product đó, giúp phân tách dữ liệu giữa các sản phẩm khác nhau.

Mỗi Product gồm các trường thông tin sau.

- Tên Product
- Mô tả
- Người phụ trách, Owner
- Ngày tạo
- Danh sách thành viên được gán vào Product, Phase 2, tạm chưa áp dụng, dùng khi hệ thống dùng chung cho nhiều dự án và nhiều người

**Giai đoạn hiện tại:** chỉ có một người dùng, mặc định có quyền thao tác trên toàn bộ Product.

**Phase 2:** Chỉ Admin có quyền tạo, sửa, xóa Product. Member được gán vào Product nào thì chỉ thấy và thao tác trên dữ liệu của Product đó.

### 4.2 Danh sách loại Test ở sidebar

Sau khi chọn Product, sidebar hiển thị 12 loại test sau, dạng danh sách cuộn.

1. Unit Test
2. Integration Test
3. UI Test
4. Performance Test
5. API Test
6. Regression Test
7. Smoke Test
8. Security Test
9. Compatibility Test
10. Usability Test
11. Load or Stress Test
12. Acceptance Test, UAT

## 5. Chi tiết 8 tab, Test Suite, Category, Graph, Timeline, Requirement, Report, Environment, Comments

### 5.1 Test Suite

Panel 1 chỉ hiển thị danh sách tên các Test Suite thuộc loại test đang chọn, dạng danh sách gọn, không hiển thị chi tiết.

Khi click vào một Suite, panel 1 hiển thị thêm danh sách tiêu đề Test Case thuộc Suite đó ngay bên dưới tên Suite, dạng danh sách title, chưa hiển thị chi tiết từng case.

Khi click vào tên Suite, hoặc vào một Test Case trong danh sách, panel 2 hiển thị thông tin chi tiết tương ứng.

- Nếu click vào Suite, panel 2 hiển thị chi tiết Suite, gồm các trường thông tin sau.
  - Tên Suite
  - Mô tả, mục đích của Suite
  - Module hoặc chức năng liên quan, ví dụ Login, Payment, Checkout
  - Người phụ trách, Owner
  - Độ ưu tiên, High, Medium, Low
  - Ngày tạo, ngày cập nhật gần nhất
  - Tổng số Test Case, số Pass, số Fail, tính tự động
  - Trạng thái Suite, Active, Deprecated, Draft
- Nếu click vào một Test Case, panel 2 hiển thị chi tiết Case, gồm Status, History, Retry, theo mục 6.

### 5.2 Category

Category phân loại theo module hoặc tính năng, ví dụ Login, Cart, Payment. Khi click vào một Category, hệ thống lọc ra các Suite và Case thuộc module đó, kèm số liệu tổng số case và tỷ lệ pass của từng category.

### 5.3 Graph

Graph hiển thị các biểu đồ sau.

- Biểu đồ Pass, Fail, Blocked, Not Run, theo Suite hoặc toàn bộ loại test
- Biểu đồ xu hướng tỷ lệ Pass theo thời gian, theo ngày, tuần hoặc sprint
- Test Coverage, tỷ lệ phần trăm chức năng đã có test case
- Số lượng bug phát sinh theo mức độ nghiêm trọng, nếu có tích hợp bug tracking

### 5.4 Timeline

Timeline hiển thị lịch sử chạy test theo trục thời gian. Mỗi mốc thể hiện ngày giờ chạy, người chạy, build hoặc version được test, kết quả tổng quan của lần chạy đó. Người dùng có thể click vào từng mốc để xem chi tiết case nào fail.

### 5.5 Requirement

Tab Requirement hiển thị liên kết giữa Test Case và yêu cầu hoặc user story gốc, phục vụ mục đích Traceability, chứng minh mức độ phủ của test case đối với yêu cầu. Nội dung gồm.

- Danh sách yêu cầu hoặc user story, có thể nhập tay hoặc đồng bộ từ công cụ quản lý yêu cầu bên ngoài
- Với mỗi yêu cầu, hiển thị danh sách Test Case đang cover yêu cầu đó
- Cảnh báo yêu cầu chưa có Test Case nào cover
- Xuất được Traceability Matrix, bảng đối chiếu yêu cầu và test case, phục vụ audit hoặc báo cáo cho khách hàng

### 5.6 Report

Tab Report cho phép xuất báo cáo tổng hợp để gửi cho PM, khách hàng, hoặc lưu hồ sơ. Nội dung gồm.

- Chọn phạm vi báo cáo, theo Suite, theo Product, hoặc theo khoảng thời gian
- Xuất file định dạng PDF, Excel, hoặc CSV
- Nội dung báo cáo gồm tổng số case, tỷ lệ Pass Fail Blocked, danh sách case Fail kèm ghi chú, biểu đồ tổng hợp
- Lưu lại lịch sử các báo cáo đã xuất, kèm ngày xuất và người xuất

### 5.7 Environment

Tab Environment quản lý thông tin môi trường chạy test, giúp phân biệt kết quả theo môi trường thay vì gộp chung. Nội dung gồm.

- Danh sách môi trường, ví dụ Development, Staging, Production
- Với UI Test và Compatibility Test, ghi nhận thêm thiết bị, hệ điều hành, trình duyệt cụ thể
- Mỗi lần chạy Test Case ghi nhận rõ chạy trên môi trường nào, thông tin này gắn kèm vào History
- Graph và Timeline có thể lọc theo Environment để tránh hiểu nhầm khi so sánh kết quả giữa các môi trường khác nhau

### 5.8 Comments, Phase 2, tạm chưa áp dụng

Tab Comments cho phép QA trao đổi trực tiếp trong ngữ cảnh của Suite hoặc Case, tránh mất ngữ cảnh khi phải trao đổi qua kênh chat bên ngoài. Đây là tính năng phục vụ cộng tác nhiều người, tạm chưa cần thiết ở giai đoạn đơn người dùng hiện tại, giữ lại thiết kế để mở rộng ở Phase 2. Nội dung gồm.

- Bình luận theo dạng thread, gắn vào Suite hoặc từng Test Case cụ thể
- Gắn thẻ, mention, một thành viên khác để yêu cầu xác nhận hoặc bàn giao
- Lưu lại lịch sử bình luận, không cho xóa hẳn mà chỉ đánh dấu đã ẩn, phục vụ truy vết sau này

## 6. Chi tiết Test Case, hiển thị tại Panel 2, Status, History, Retry

### 6.1 Status

Các trạng thái của Test Case gồm.

- Not Run
- In Progress
- Pass
- Fail
- Blocked
- Skipped

### 6.2 History

Mỗi lần chạy một Test Case, hệ thống lưu lại các thông tin sau.

- Thời gian chạy
- Người chạy
- Kết quả, Pass, Fail, Blocked và các trạng thái khác
- Build hoặc version test trên đó
- Ghi chú lỗi nếu Fail, có thể đính kèm ảnh hoặc log
- Link tới bug ticket nếu có, ví dụ Jira ID

### 6.3 Retry

Chức năng Retry gồm hai phần.

- Nút Retry cho phép chạy lại ngay khi case bị Fail
- Log lịch sử các lần retry được lưu vào History, ghi rõ lần thử thứ mấy và kết quả mỗi lần

## 7. Chức năng CRUD cho Suite và Case

Hệ thống hỗ trợ đầy đủ chức năng tạo, sửa, xóa và sao chép, clone, cho cả Test Suite và Test Case, trong phạm vi Product mà người dùng được gán.

**Giai đoạn hiện tại, đơn người dùng:** tài khoản duy nhất tạo, sửa, xóa trực tiếp Suite và Case, không cần bước phê duyệt.

**Phase 2, đa người dùng, tạm chưa áp dụng:**

- Admin, tạo, sửa, xóa trực tiếp Suite và Case, không cần phê duyệt.
- Member, tạo và sửa Suite hoặc Case trực tiếp. Khi Member thực hiện thao tác xóa, hệ thống tạo một yêu cầu xóa, Suite hoặc Case được đánh dấu Chờ duyệt, dữ liệu chỉ bị xóa hẳn sau khi Admin phê duyệt yêu cầu đó. Admin có thể từ chối yêu cầu, khi đó Suite hoặc Case trở lại trạng thái bình thường.

Product chỉ do Admin tạo, sửa, xóa, theo mục 4.1.

## 8. Đăng nhập và phân quyền

Hệ thống dùng cơ chế đăng nhập đơn giản bằng tài khoản nội bộ, username và password, không liên kết với Gmail hay các nhà cung cấp đăng nhập ngoài.

**Giai đoạn hiện tại, đơn người dùng:** chỉ có một tài khoản duy nhất, không phân biệt vai trò, không cần màn hình quản lý người dùng, không cần luồng phê duyệt cấp lại mật khẩu vì chỉ có một người dùng cũng chính là người quản trị hệ thống.

### 8.1 Đăng nhập và ghi nhớ đăng nhập

Màn hình đăng nhập gồm username, password, và tùy chọn Ghi nhớ đăng nhập. Khi bật tùy chọn này, hệ thống giữ phiên đăng nhập trên thiết bị đó, người dùng không cần nhập lại username và password ở các lần truy cập sau, cho đến khi chủ động đăng xuất hoặc phiên hết hạn.

### 8.2 đến 8.4, Phase 2, đa người dùng, tạm chưa áp dụng

Các nội dung sau được giữ lại trong tài liệu để tham khảo khi mở rộng hệ thống cho khoảng 20 người dùng, tạm chưa triển khai ở giai đoạn hiện tại.

**Quên mật khẩu:** hệ thống không tự động gửi email khôi phục mật khẩu. Khi quên mật khẩu, người dùng gửi yêu cầu kèm tên tài khoản đến Admin. Admin xác nhận yêu cầu và cấp lại mật khẩu mới cho tài khoản đó. Người dùng đăng nhập bằng mật khẩu mới do Admin cấp, có thể đổi lại mật khẩu sau khi đăng nhập thành công.

**Tạo tài khoản:** chỉ Admin có quyền tạo tài khoản mới cho thành viên, không có chức năng tự đăng ký. Khi tạo tài khoản, Admin nhập username, mật khẩu ban đầu, họ tên hiển thị, vai trò Admin hoặc Member, Product được gán cho tài khoản đó. Sau khi tạo, Admin gửi thông tin đăng nhập ban đầu cho thành viên, thành viên nên đổi mật khẩu ngay lần đăng nhập đầu tiên.

**Giao diện quản lý người dùng:** Admin có một màn hình quản lý người dùng riêng, hiển thị danh sách toàn bộ tài khoản trong hệ thống, gồm username, mật khẩu hiện tại hiển thị trực tiếp cho Admin xem, họ tên hiển thị, vai trò, Product được gán, trạng thái tài khoản Active hoặc Khóa. Từ màn hình này, Admin có thể tạo tài khoản mới, sửa thông tin, đặt lại mật khẩu, khóa hoặc mở khóa tài khoản.

Chi tiết luồng đăng nhập, quên mật khẩu và các yêu cầu backend liên quan sẽ được bổ sung ở phiên bản cập nhật tiếp theo của tài liệu này.

## 9. Tích hợp automation, Playwright và JMeter push kết quả

Hệ thống cho phép nhận kết quả kiểm thử tự động từ Playwright và JMeter thông qua các cơ chế sau.

- Cơ chế push, một REST API endpoint duy nhất nhận kết quả test. Playwright sử dụng custom reporter để tự động gọi API sau khi test suite chạy xong. JMeter sử dụng Backend Listener hoặc một script hậu xử lý trong pipeline CI CD để gọi API sau khi chạy xong.
- Định dạng dữ liệu, hệ thống định nghĩa một JSON schema chung, tên case, suite, status, thời gian chạy, duration, lỗi nếu có, build version. Reporter của Playwright và script của JMeter chịu trách nhiệm chuyển đổi kết quả gốc của từng công cụ về đúng schema này trước khi gửi lên.
- Xác thực, mỗi user hoặc mỗi project được cấp một API Key cố định, gắn vào header Authorization khi gọi API.
- Xử lý dữ liệu khi nhận kết quả, hệ thống tìm Test Case theo tên case kết hợp tên suite. Nếu tìm thấy, cập nhật Status và thêm một record vào History. Nếu không tìm thấy, tự động tạo Test Case mới và gắn cờ Auto Created để QA review lại thông tin sau.
- Công cụ hỗ trợ tích hợp, một package nhỏ cho Playwright, cài đặt và cấu hình trong project Playwright hiện có, và một script mẫu cho JMeter chạy trong pipeline CI CD.

## 10. Giả định, phạm vi và ràng buộc

- Giai đoạn hiện tại, hệ thống phục vụ một người dùng duy nhất, chạy trên máy cá nhân, localhost.
- Không tích hợp đăng nhập qua bên thứ ba.
- Ở giai đoạn hiện tại, bảo mật không phải ưu tiên hàng đầu. Các biện pháp bảo mật nâng cao, mã hóa mật khẩu, kiểm soát truy cập chặt chẽ hơn, sẽ được xem xét bổ sung ở giai đoạn phát triển sau.
- Phần chi tiết kỹ thuật, kiến trúc hệ thống, lựa chọn công nghệ, thiết kế database và API, sẽ được trình bày trong tài liệu TDD riêng, sau khi FSD này được xác nhận.

## 11. Lộ trình mở rộng, Phase 2, đa người dùng

Khi hệ thống cần mở rộng cho khoảng 20 người dùng, các tính năng sau sẽ được kích hoạt lại, thiết kế đã có sẵn trong tài liệu này.

- Vai trò Member bên cạnh Admin, theo mục 2
- Gán nhiều thành viên vào một Product, theo mục 4.1
- Luồng phê duyệt yêu cầu xóa từ Member, theo mục 7
- Quên mật khẩu qua Admin, tạo tài khoản cho thành viên, giao diện quản lý người dùng, theo mục 8.2 đến 8.4
- Tính năng mention trong tab Comments, theo mục 5.8
