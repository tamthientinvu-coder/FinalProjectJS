# BÁO CÁO KHẮC PHỤC VÀ KIỂM ĐỊNH CUỐI — LEARNQUIZ

**Ngày chốt:** 01/09/2026  
**Mốc trước khắc phục:** `c4b99d0`  
**Phạm vi đối chiếu:** “ĐỀ TÀI 4 — Nền Tảng Học Tập & Quiz Trực Tuyến”, báo cáo review tại mốc `c4b99d0`, toàn bộ source backend/frontend, CI và hồ sơ bảo vệ.  
**Nguyên tắc bằng chứng:** chỉ công nhận kết quả đã đọc từ code hoặc chạy thực tế; không suy diễn từ README.

## 1. Kết luận điều hành

Tất cả 12 finding F1–F12 trong báo cáo review đã có biện pháp khắc phục bằng code, test hồi quy hoặc release gate. Các lỗi P1 về vượt lộ trình, sửa nội dung sau duyệt, mất lịch sử học tập và race condition quản trị đã được đóng ở tầng service/transaction; ranh giới ba vai trò được siết ở cả route và service.

Trạng thái kiểm định cuối:

- Backend: lint, typecheck, **344/344** phép khẳng định, build, Prisma validate đều đạt.
- Frontend: lint, typecheck, **13/13** unit test, **3/3** Playwright smoke E2E, production build đều đạt.
- Bảo mật phụ thuộc production: backend và frontend đều **0 vulnerability**.
- DOCX/PPTX: OpenXML validation **0 lỗi**; slide có **0 cảnh báo**; kiểm tra trực quan không thấy tràn/cắt chữ.
- Bundle chính giảm từ 863,08 kB xuống 323,96 kB, giảm khoảng **62,5%**; các trang đã tách thành route chunk.

Về chức năng và chất lượng code, dự án đủ điều kiện để đóng gói bản nộp. Hai việc không thể tự hoàn tất nếu thiếu dữ liệu/quyền bên ngoài là điền **mã học viên** và chạy luồng tích hợp toàn phần trên một PostgreSQL/staging dùng để ghi dữ liệu thử. Đây là điều kiện vận hành cuối, không phải lỗi logic còn mở trong source.

## 2. Ma trận khắc phục F1–F12

| Finding | Khắc phục đã áp dụng | Bằng chứng kiểm định | Trạng thái |
|---|---|---|---|
| F1 — hoàn thành bài đang khóa | `markComplete` chỉ dành cho student, kiểm tra enrollment và dùng cùng chính sách mở khóa trước khi ghi progress | Regression test bài 2 trước bài 1 trả 403, không tạo progress | Đóng |
| F2 — sửa nội dung đã duyệt | Chính sách mutation dùng chung: pending bị đóng băng; sửa published đưa khóa về draft để phải duyệt lại; thay đổi lesson/quiz cũng chạm trạng thái course | Test course/lesson/quiz ở pending và published | Đóng |
| F3 — cascade mất lịch sử | Chặn xóa lesson đã có progress/submission; chặn xóa quiz đã có submission | Test 409 và xác nhận dữ liệu lịch sử còn nguyên | Đóng |
| F4 — race sửa đề/nộp bài | Gom check + ghi vào transaction Serializable, có retry với xung đột serialization | Test transaction/retry và toàn bộ quiz suite xanh | Đóng ở tầng code; nên stress lại trên PostgreSQL thật |
| F5 — khóa admin cuối cùng | Đếm admin và update trong transaction Serializable có retry | Test invariant luôn còn một admin hoạt động | Đóng ở tầng code; nên stress lại trên PostgreSQL thật |
| F6 — role học viên | Thêm `authorize("student")` ở route và guard ở service cho enroll/complete/submit/list-mine | HTTP/service regression trả 403 cho instructor/admin | Đóng |
| F7 — làm lại sau khi đạt | Backend chặn submit tiếp sau khi đã đạt; response trả `canAttempt=false`; UI ẩn nút làm lại | Quiz service test và UI logic test | Đóng |
| F8 — đổi passScore hồi tố | Khóa thay đổi passScore sau khi đã có submission | Test đổi threshold sau nộp trả 409 | Đóng |
| F9 — course thiếu dữ liệu vẫn gửi duyệt | Submit-for-review kiểm tra description, thumbnail, category và ít nhất một lesson | Test draft thiếu trường bị chặn, bản đầy đủ chuyển pending | Đóng |
| F10 — thiếu coverage frontend | Bổ sung Playwright role-routing smoke và chạy trong CI; bảo đảm guest/student/instructor được điều hướng đúng | 3/3 E2E đạt trên Chromium | Đóng phần smoke; full workflow staging là gate vận hành |
| F11 — bundle lớn | Chuyển các trang sang `React.lazy`/Suspense và tách route chunk | Main JS 323,96 kB, không còn cảnh báo chunk >500 kB | Đóng |
| F12 — thiếu lint gate | Thêm ESLint cho Node/TypeScript/React/E2E/config và đưa lint vào CI | Cả backend/frontend lint sạch với `--max-warnings=0` | Đóng |

## 3. Kiểm định yêu cầu theo vai trò

### 3.1. Học viên

- Xem/tìm/lọc khóa công khai và ghi danh miễn phí.
- Học tuần tự; không thể vượt khóa bằng cách gọi API trực tiếp.
- Đánh dấu hoàn thành, theo dõi phần trăm tiến độ và điểm trung bình.
- Làm quiz, chấm điểm hoàn toàn phía máy chủ, không lộ `isCorrect` trước khi nộp.
- Xem đúng/sai ngay sau nộp; chỉ làm lại khi chưa đạt và còn lượt.
- Dùng AI giải thích đáp án sai/tóm tắt khi Gemini được cấu hình.

### 3.2. Giảng viên

- CRUD khóa học, lesson, quiz; mỗi câu có đúng bốn lựa chọn và một đáp án đúng.
- Không thể sửa khóa pending; sửa khóa published buộc quay lại draft và duyệt lại.
- Không thể hard-delete dữ liệu đã phát sinh lịch sử học/điểm.
- Xem thống kê học viên, tiến độ, số lượt làm và điểm trung bình.
- Sinh câu hỏi AI chỉ tạo bản nháp, vẫn qua validator nghiệp vụ trước khi lưu.

### 3.3. Quản trị viên

- Duyệt/từ chối/gỡ khóa theo state machine hợp lệ.
- CRUD category và khóa/mở tài khoản; refresh token bị thu hồi khi khóa.
- Invariant “còn ít nhất một admin hoạt động” được bảo vệ bằng transaction.
- Có dashboard tổng quan và xếp hạng khóa đã công khai.

## 4. Bằng chứng release gate đã chạy

| Gate | Lệnh | Kết quả |
|---|---|---|
| Backend lint | `npm run lint` | Đạt |
| Backend typecheck | `npm run typecheck` | Đạt |
| Backend test | `npm test` | 344/344 |
| Backend build | `npm run build` | Đạt |
| Prisma | `npx prisma validate` | Schema hợp lệ |
| Frontend lint | `npm run lint` | Đạt, bao gồm src/E2E/config |
| Frontend typecheck | `npm run typecheck` | Đạt |
| Frontend unit test | `npm test` | 4 file, 13/13 |
| Frontend E2E | `npm run test:e2e` | 3/3 Chromium |
| Frontend build | `npm run build` | Đạt; main 323,96 kB, gzip 102,86 kB |
| Dependency audit | `npm audit --omit=dev` | 0 vulnerability ở cả hai app |
| DOCX validation | `officecli validate` | 0 lỗi OpenXML |
| PPTX validation | `officecli validate` | 0 lỗi OpenXML; 0 issue |

## 5. Kiểm định hồ sơ tốt nghiệp

Đã cập nhật đồng nhất số test từ 318/318 lên 344/344 trong báo cáo Word và slide. Các lỗi schema paragraph border, numbering, style và chart axis đã được sửa. Trang bìa, trang nội dung mẫu và lưới 17 slide đã được render để kiểm tra; không thấy đối tượng chồng lấn, cắt chữ hoặc tràn trang.

Word còn 452 cảnh báo mức thấp của bộ phân tích: chủ yếu là paragraph trống dùng cho ngắt/dàn trang, khoảng trắng có chủ ý trong code block/bảng biểu, và paragraph không thụt đầu dòng. Đây không phải lỗi OpenXML và không gây lỗi render. Không nên sửa cơ học vì sẽ phá code formatting hoặc bố cục hồ sơ.

**Thiếu dữ liệu duy nhất:** “Mã học viên” còn để trống ở hai vị trí trang đầu. Không có nguồn đáng tin cậy trong repository để điền, nên không tự suy đoán. Trước khi nộp, thay cả hai placeholder bằng mã chính thức của học viên.

## 6. Rủi ro còn lại và phạm vi không giả lập thành công

1. Playwright hiện là smoke test route/quyền với API mock; chưa thay thế E2E ba luồng đầy đủ trên backend + PostgreSQL thật.
2. Transaction Serializable đã được kiểm thử bằng fake Prisma, nhưng race F4/F5 nên được stress lại trên PostgreSQL disposable trước production.
3. Không gọi Gemini live trong lần chốt này vì cần API key/quota thật; code đã có test timeout, 403, 429, 5xx, malformed JSON và không rò secret.
4. Không thay đổi Render/Vercel/database production và không chạy seed production. Mọi thao tác deploy phải dùng cấu hình hiện tại và backup dữ liệu.

Các điểm trên là bước xác nhận môi trường, không làm thay đổi kết luận rằng source hiện đã khớp yêu cầu chức năng cốt lõi.

## 7. Acceptance checklist trước khi nộp

- [x] Không còn finding P1/P2 logic chưa có biện pháp khắc phục.
- [x] Backend/frontend lint, typecheck, test, build xanh.
- [x] Prisma schema hợp lệ; audit production 0 vulnerability.
- [x] CI có lint, unit test, Playwright và build.
- [x] DOCX/PPTX validate sạch và đã kiểm tra trực quan.
- [ ] Điền mã học viên chính thức ở hai vị trí trong DOCX.
- [ ] Chạy full E2E ba vai trò trên staging/disposable PostgreSQL.
- [ ] Test một lời gọi Gemini live bằng tài khoản demo.
- [ ] Push commit và redeploy khi chủ dự án phê duyệt.

## 8. Khuyến nghị bàn giao

Có thể dùng code hiện tại để demo/bảo vệ. Trước khi phát hành production, hoàn thành bốn ô chưa đánh dấu ở trên. Tuyệt đối không dùng `seed:prod` trên cơ sở dữ liệu có dữ liệu thật nếu chưa backup và phê duyệt rõ ràng.
