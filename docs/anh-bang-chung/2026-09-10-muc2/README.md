# Ảnh bằng chứng — mục 2 (I01–I03), phiên 10/09/2026

Tài khoản dùng: **QA Giảng viên id 10** `qa-hv-260909-gv@example.com`.
Quy ước tên tệp: `<ca>-b<bước>-<số thứ tự>-<nội dung>.png`.

| Tệp | Bước | Nội dung · dùng để chứng minh gì |
|---|---|---|
| `I01-b1-01-dashboard-giang-vien-qa.png` | 1a | Dashboard vai giảng viên: *Xin chào QA Giảng viên*, `Vai trò: instructor`, hai nút **Quản lý khóa học** / **Tạo khóa học mới**. Console `No errors · No warnings` → **Đ3** (gói đo lường chỉ mount khi PROD). `favicon.svg` **304** → **Đ1** (hết `favicon.ico 404`) |
| `I01-b1-02-url-hai-dau-gach-cheo-404.png` | 1b | URL `localhost:5173//instructor/courses` (hai dấu gạch chéo) → trang **404 · Không tìm thấy trang**; `NotFoundPage.tsx` nạp động; **không** request nào tới `/courses/mine` → route không khớp thì không rò rỉ request API |
| `I01-b1-03-auth-me-headers-csp-cors.png` | 1b′ | Headers của `GET /api/v1/auth/me`: `Access-Control-Allow-Origin: http://localhost:5173` (không dùng `*`), CSP đầy đủ (`object-src 'none'`, `frame-ancestors 'self'`), COOP/CORP `same-origin`, `Referrer-Policy: no-referrer`, `Ratelimit 300;w=60` |
| `I01-b1-04-auth-me-response-id10-instructor.png` | 1b′ | Thân response `auth/me`: `id 10`, `role instructor`, `isActive true` — **không có** trường `password` |
| `I01-b1c-05-khoa-hoc-cua-toi-trang-thai-rong.png` | 1c | Trang **Khóa học của tôi** với trạng thái trống *"Bạn chưa có khóa học nào"* + nút **+ Tạo khóa học**; URL đúng một dấu gạch chéo. Ảnh mở đầu cho phần demo mục 2 |
| `I01-b1c-06-courses-mine-304-headers.png` | 1c | Headers `GET /api/v1/courses/mine` → **304**; chứng minh **danh sách riêng tư có endpoint phạm vi riêng ở máy chủ** (điểm mạnh số 3) |
| `I01-b1c-07-courses-mine-preview-data-rong.png` | 1c | Preview: `{success: true, data: []}` — khớp DB `count(*) where instructor_id=10 = 0` |
| `I01-b1c-08-courses-mine-response-raw.png` | 1c | Response thô của cùng request — bản gọn để chèn slide |
| `I01-b2-09-form-tao-khoa-truoc-khi-luu.png` | 2 | Form **Tạo khóa học mới** với dữ liệu cố ý sai (`QA`, `khong-phai-url`), **trước** khi bấm lưu — thấy đủ năm trường |
| `I01-b2-10-hai-loi-validation-client.png` | 2 | Hai lỗi validation tiếng Việt: *"Tên khóa học tối thiểu 5 ký tự"* · *"Ảnh bìa phải là URL hợp lệ (bắt đầu bằng http)"*; **không** có `POST /courses` → chặn ngay tại client. **Ảnh chủ lực cho phần validation khi báo cáo** |
| `I01-b2-11-categories-304-headers.png` | 2 | `GET /api/v1/categories` → **304** — danh mục nạp từ máy chủ, không hard-code trong front-end |
| `I01-b2b-12-issues-form-field-thieu-id-name.png` | 2b | Tab Issues: *"A form field element should have an id or name attribute"* — bộ đếm **0 đỏ · 0 vàng · 1 xanh (info)** |
| `I01-b2c-13-violating-node-textarea-bong-mui.png` | 2c | Violating node là `textarea` **628 × 0** — textarea bóng của `TextareaAutosize` (MUI) dùng để đo chiều cao ô **Mô tả**. **Bằng chứng gợi ý đó thuộc thư viện, không thuộc mã dự án** — dùng ảnh này nếu hội đồng hỏi |
| `I01-b3-14-danh-sach-co-khoa-qa-ban-nhap.png` | 3 | Bảng **Khóa học của tôi** sau khi tạo: khóa **QA-20260910-0700 Kiem thu tay** · Ngôn ngữ lập trình · Cơ bản · 0 bài học · 0 học viên · nhãn **Bản nháp** |
| `I01-b3-15-post-courses-201-created.png` | 3 | `POST /api/v1/courses` → **201 Created**, `Content-Length: 694` |
| `I01-b3-16-post-courses-401-token-het-han.png` | 3 | Lần gọi đầu bị **401 Unauthorized** vì access token hết hạn (form mở quá 15 phút) |
| `I01-b3-17-chuoi-401-refresh-201-cot-status.png` | 3 | **Ảnh vàng của cả buổi:** cột Status cho thấy trọn chuỗi `401 → refresh 200 → 201 Created` — **đúng một** lần refresh, request được gọi lại và thành công, không mất dữ liệu đang gõ. Dùng ảnh này để trả lời câu hỏi *"vì sao log có dòng 401?"* và để minh chứng cho **slide 18** |
| `I01-b3-18-response-401-token-da-het-han.png` | 3 | Thân response 401: `{"success":false,"message":"Token đã hết hạn"}` — thông điệp tiếng Việt rõ nghĩa, không lộ chi tiết nội bộ |
| `I01-b4-19-reload-mine-response-id33-draft.png` | 4 | Sau F5: `data[0]` có `id 33`, `status "draft"`, `publishedAt null`, `rejectReason null`, `category` nhúng sẵn. Console `No errors` và **không còn** `1 issue` (đã rời trang có ô multiline) |
| `I01-b4-20-reload-mine-304-headers.png` | 4 | Headers `courses/mine` **304** sau khi tải lại — bản đối chiếu |
| `I01-b5-21-soan-bai-hoc-trang-thai-rong.png` | 5 | Trang **Soạn bài học** của khóa 33: khung chỉ dẫn luật lộ trình, trạng thái trống *"Khóa học cần ít nhất 1 bài học trước khi gửi quản trị viên duyệt"*, nút **+ Thêm bài học đầu tiên** |
| `I01-b5-22-lessons-response-rong.png` | 5 | `GET /courses/33/lessons` → `{"success":true,"data":[]}` — mốc "0 bài học" trước khi tạo |
| `I01-b5-23-lessons-304-headers.png` | 5 | Headers `courses/33/lessons` **304** |
| `I01-b5-24-courses-33-304-headers.png` | 5 | Headers `courses/33` **304** — trang gọi **hai** endpoint: chi tiết khóa và danh sách bài học |
| `I01-b6a-25-dialog-them-bai-hoc-ba-truong.png` | 6a | Dialog **Thêm bài học** với ba trường: Tên bài học · Nội dung bài học *(chú thích: "Nội dung này sẽ là nguồn để Gemini sinh câu hỏi quiz ở Sprint 5")* · Link video (không bắt buộc). Ảnh dùng khi nói về **liên kết giữa nội dung bài học và chức năng AI** |
| `I01-b6b-26-danh-sach-bai-a-1-bai-hoc.png` | 6b | Thẻ **Bài A** đánh số 1 với đoạn nội dung cắt ngắn và 5 nút thao tác; phụ đề đổi thành *"· 1 bài học"* |
| `I01-b6b-27-chuoi-401-refresh-201-lesson.png` | 6b | Cột Status: `401 → refresh 200 → 201 → 200` — chuỗi refresh lặp lại lần thứ hai, lần này trên `POST /courses/33/lessons` |
| `I01-b6b-28-post-lessons-201-created.png` | 6b | Headers `POST /api/v1/courses/33/lessons` → **201 Created**, `Content-Length: 608` |
| `I01-b6b-29-lessons-response-id58-order1.png` | 6b | `GET /courses/33/lessons` sau khi tạo: `id 58`, `order 1`, `videoUrl null`, `quiz null` |
| `I01-b6b-30-post-response-da-them-bai-hoc.png` | 6b | Thân response 201: `message "Đã thêm bài học"` + object bài học đầy đủ |
| `I01-b6c-31-warning-aria-hidden-focus.png` | 6c | Cảnh báo *"Blocked aria-hidden on an element because its descendant retained focus"* — `Element with focus` là một `MuiButton`, `Ancestor with aria-hidden` là `div#root`, nguồn `courses/33/lessons:1` (trình duyệt phát ra). Bằng chứng cho **Đ6** |
| `I01-b6c-32-issues-van-la-mot-goi-y-info.png` | 6c | Tab Issues vẫn **0 đỏ · 0 vàng · 1 xanh** — cảnh báo a11y không được Chrome xếp vào Issues |
| `I01-b6d-33-danh-sach-hai-bai-hoc-id59.png` | 6d | Hai bài A · B trong danh sách + response `id 59`, `order 2`; toast **"Đã thêm bài học"**; mũi tên biên bị làm mờ đúng |
| `I01-b6d-34-post-lessons-201-bai-b.png` | 6d | Headers `POST /courses/33/lessons` (Bài B) → **201 Created**, `Content-Length: 633` |
| `I01-b6d-35-refresh-200-hai-dong-401.png` | 6d | Headers `POST /auth/refresh` → **200**; Console có đúng **2** dòng 401, mỗi lần tạo bài một dòng |
| `I01-b6d-36-401-content-length-52.png` | 6d | Headers dòng 401: `Content-Length: 52` — thân lỗi rất gọn, không lộ chi tiết nội bộ |
| `I01-b6e-37-dialog-bai-c-truoc-khi-luu.png` | 6e | Dialog Bài C đã điền, **trước** khi lưu — thấy placeholder `https://www.youtube.com/watch?v=…` của ô Link video |
| `I01-b6e-38-ba-bai-hoc-post-201.png` | 6e | **Ảnh chốt của bộ dữ liệu:** ba bài **1 · 2 · 3** đúng thứ tự A → B → C, phụ đề *"· 3 bài học"*, `POST` → **201**, `Content-Length: 564` |
| `I01-b6e-39-response-id60-order3.png` | 6e | Thân response 201: `id 60`, `order 3`, `videoUrl null`, `quiz null` |
| `I01-b6e-40-get-lessons-200-1659-byte.png` | 6e | `GET /courses/33/lessons` → **200**, `Content-Length: 1659` — ba bài học đã nằm trên máy chủ |
| `I01-b6e-41-danh-sach-day-du-ba-bai.png` | 6e | Mảng `data` trong response: object `id 58` rồi `id 59`… — bằng chứng thứ tự do máy chủ trả về |
| `I01-b7-42-dialog-sua-bai-hoc-dien-san.png` | 7 | Dialog **Sửa bài học** **điền sẵn** đúng tên và toàn văn nội dung cũ của Bài A — bằng chứng đường sửa không làm mất dữ liệu |
| `I01-b7-43-dialog-da-dien-link-video.png` | 7 | Đã điền Link video, trước khi lưu |
| `I01-b7-44-patch-lessons-58-200.png` | 7 | **`PATCH /api/v1/lessons/58`** → **200 OK** — chú ý: `PATCH`, và endpoint **không** lồng dưới `/courses` (khác endpoint tạo). Dùng cho bộ Postman mục 5 |
| `I01-b7-45-response-videourl-updatedat.png` | 7 | Response: `videoUrl` đã lưu · `order` vẫn **1** · `createdAt` giữ nguyên, `updatedAt` đổi 01:54 → 02:18 |
| `I01-b7-46-get-lessons-200-1700-byte.png` | 7 | `GET /courses/33/lessons` → **200**, `Content-Length` **1659 → 1700** — đúng phần tăng của chuỗi URL |
| `I01-b8a-47-thu-tu-a-c-b-response-reorder.png` | 8a | Thứ tự đã thành **A · C · B**; response `message "Đã cập nhật thứ tự bài học"` kèm **cả danh sách** đã sắp xếp lại |
| `I01-b8a-48-patch-lessons-reorder-200.png` | 8a | **`PATCH /api/v1/courses/33/lessons/reorder`** → **200 OK** — đổi thứ tự là **hành động riêng**, không phải sửa `order` từng bài. Dùng cho bộ Postman mục 5 |
| `I01-b8b-49-thu-tu-c-a-b.png` | 8b | Thứ tự **C · A · B** sau cú bấm thứ hai; headers `reorder` **200** |
| `I01-b8b-50-chuoi-401-refresh-reorder-200.png` | 8b | Cột Status: `reorder 401 → refresh 200 → reorder 200` — cơ chế refresh chạy đúng cả trên thao tác **`PATCH`** |
| `I01-b8b-51-response-id60-order1.png` | 8b | Response: `id 60` (Bài C) đã có `order: 1`, `updatedAt` 02:29:00 |
| `I01-b8c-52-sau-f5-thu-tu-giu-nguyen-console-sach.png` | 8c | Sau **F5**: thứ tự vẫn **C · A · B**, `courses/33/lessons` → **304**, và Console **`No errors · No warnings · No issues`**. **Ảnh trả lời cho câu "sao DevTools có số đỏ?"** — đỏ chỉ là lịch sử phiên, tải lại là hết |
| `I01-b8c-53-response-sau-f5-id60-order1.png` | 8c | Response sau F5: `id 60` vẫn `order 1` — thứ tự do máy chủ giữ |
| `I01-b8d-54-sau-cu-thu-nhat-a-c-b.png` | 8d | Cú bấm xuống thứ nhất: **A · C · B**, `reorder` **200** |
| `I01-b8d-55-thu-tu-cuoi-a-b-c-reorder-200.png` | 8d | Cú thứ hai: về đúng **A · B · C** — thứ tự thiết kế của bộ dữ liệu |
| `I01-b8d-56-response-id58-order1-videourl-con.png` | 8d | Response cuối: `id 58 · order 1` và **`videoUrl` vẫn còn** — đổi thứ tự bốn lần không làm mất dữ liệu nội dung |
| `I01-b9-57-dialog-xac-nhan-xoa-bai-b.png` | 9 | Hộp thoại **Xóa bài học** nêu đích danh tên bài và **cảnh báo hậu quả**: *"Quiz và tiến độ học viên của bài này cũng bị xóa theo"*; nút **Xóa** đỏ, nút **Hủy** nhẹ. **Ảnh tốt cho phần UX khi báo cáo** |
| `I01-b9-58-sau-huy-bai-b-con-nguyen.png` | 9 | Sau khi **Hủy**: Bài B còn nguyên, bộ đếm Network **không tăng** (257 requests) → **không có `DELETE`** nào |
| `I01-b10a-59-post-201-bai-d.png` | 10a | `POST` Bài D → **201 Created**, `Content-Length: 387`; danh sách thành **4 bài học** |
| `I01-b10a-60-response-id61-order4.png` | 10a | Response: `id 61`, `order 4` — bài phụ sẽ bị xóa ở 10b |
| `I01-b10a-61-get-lessons-200-2030-byte.png` | 10a | `GET /courses/33/lessons` → **200**, `Content-Length` **1752 → 2030** |
| `I01-b10b-62-delete-lessons-61-200.png` | 10b | **`DELETE /api/v1/lessons/61`** → **200 OK**, `Content-Length` **49** byte; danh sách về 3 bài |
| `I01-b10b-63-response-da-xoa-bai-hoc.png` | 10b | Thân response: `{"success":true,"message":"Đã xóa bài học"}` |
| `I01-b10b-64-get-lessons-200-1700-tro-lai.png` | 10b | `GET /courses/33/lessons` → **200**, `Content-Length` **2030 → 1700** — đúng bằng con số trước khi tạo Bài D |

### Ca I02 — tạo quiz cho Bài A (bài 58)

| Tệp | Bước | Nội dung · dùng để chứng minh gì |
|---|---|---|
| `I02-b1-01-trang-soan-quiz-bai-58.png` | 1 | Trang **Soạn quiz** của bài 58: **Tên quiz tự sinh**, **Điểm đạt 70 sẵn**, ô **Số lượt làm tối đa** (*"Bỏ trống là không giới hạn"*), khung Câu 1 với 4 đáp án, hai nút **+ Thêm câu hỏi** / **✦ Sinh câu hỏi bằng AI** |
| `I02-b1-02-quiz-editor-200-136-byte.png` | 1 | `GET /lessons/58/quiz/editor` → **200**, `Content-Length` **136** — mốc "bài chưa có quiz" |
| `I02-b1-03-ai-status-200-headers.png` | 1 | `GET /api/v1/ai/status` → **200** khi đã đăng nhập (chưa đăng nhập thì 401) |
| `I02-b1-04-ai-status-configured-true.png` | 1 | Thân: `{"success":true,"data":{"configured":true}}` — **khóa Gemini đã cấu hình**, mục 6 chạy được với key thật |
| `I02-b1-05-quizapi-endpoints-va-ghi-chu-bao-mat.png` | 1 | Mã `quizApi.ts`: trọn bộ endpoint quiz + **hai ghi chú bảo mật trong mã** — *"server đã loại bỏ isCorrect trước khi trả về"* và *"chỉ gửi câu nào chọn đáp án nào, KHÔNG gửi điểm"*. **Ảnh mạnh cho phần bảo mật khi báo cáo** |
| `I02-b2-06-dropdown-so-luot-toi-da.png` | 2 | Danh sách **Số lượt làm tối đa**: Không giới hạn · 1 · 2 · **3** · 5 · 10 lượt — là select có sẵn, nên biên `0/21` chỉ kiểm được bằng Postman |

| `I02-b3-07-cau-1-dap-an-dung-a.png` | 3 | Câu 1 `1+1` với đáp án đúng ở **A**; thấy nút xóa câu riêng cho mỗi câu |
| `I02-b3-08-cau-2-va-3-dap-an-b-c.png` | 3 | Câu 2 đúng ở **B**, Câu 3 đúng ở **C** |
| `I02-b3-09-cau-4-dap-an-d-truoc-khi-luu.png` | 3 | Câu 4 đúng ở **D**, đủ bốn câu trước khi bấm **Lưu quiz**. Bốn vị trí đáp án khác nhau để bắt lỗi "luôn chấm đáp án đầu" |

| `I02-b4-10-put-quiz-401-truoc-refresh.png` | 4 | `PUT /lessons/58/quiz` → **401** (token hết hạn), `Content-Length` 52 |
| `I02-b4-11-refresh-200-headers.png` | 4 | `POST /auth/refresh` → **200** — **chỉ tab Headers** (tab Response chứa token, không chụp) |
| `I02-b4-12-put-quiz-200-1494-byte.png` | 4 | `PUT /lessons/58/quiz` gọi lại → **200 OK**, `Content-Length` **1494** — cả quiz đi trong **một** request |
| `I02-b4-13-response-da-luu-quiz-id37.png` | 4 | Response: `message "Đã lưu quiz"`, **`id 37`**, `passScore 70`, `maxAttempts 3`, câu đầu `id 91`. **Ảnh chốt quizId** |

| `I02-b5-14-sau-f5-sua-quiz-nut-xoa-70-3luot.png` | 5 | Sau **F5**: tiêu đề đổi **"Soạn quiz" → "Sửa quiz"**, xuất hiện nút **🗑 Xóa quiz** cạnh **Lưu quiz**; Tên quiz, **Điểm đạt 70**, **3 lượt** giữ nguyên; Câu 1 đúng ở **A**. **Ảnh chốt tính bền của dữ liệu quiz** |
| `I02-b5-15-cau-2-cau-3-dap-an-b-c-giu-nguyen.png` | 5 | Sau F5, Câu 2 đúng ở **B**, Câu 3 đúng ở **C** — vị trí đáp án không bị dồn về A |
| `I02-b5-16-cau-4-dap-an-d-editor-200-1602-byte.png` | 5 | Câu 4 đúng ở **D**; `GET /lessons/58/quiz/editor` → **200 OK**, `Content-Length` **1602** (so với **136** lúc bài chưa có quiz) |
| `I02-b5-17-response-quiz-id37-passscore70-questions.png` | 5 | Thân response: `data.lesson {id 58, courseId 33}` + `data.quiz {id 37, passScore 70, maxAttempts 3, createdAt = updatedAt, questions[0].id 91}` — **API editor trả đúng quiz đã lưu** |

**Tổng: 81 ảnh** — **64** cho ca I01 (11 bước, chia 20 lượt kiểm) và **17** cho ca I02 (bước 1 → 5). Ảnh nên dùng khi báo cáo: `I01-b2-10` (validation) · `I01-b3-17` (chuỗi 401 → refresh → 201) · `I01-b6e-38` (bộ ba bài học) · `I01-b8c-52` (Console sạch sau F5) · `I01-b9-57` (hộp thoại xóa).

> ⚠️ **Một ảnh của bước 8b đã bị loại, không lưu ở đây**: ảnh đó mở tab **Response của `/auth/refresh`** nên hiện chuỗi `accessToken` / `refreshToken`. Khi cần bằng chứng của `/auth/refresh`, chỉ chụp tab **Headers**.

> ⚠️ Ảnh chụp trong phiên kiểm tra: **không** chụp tab Payload của `login`, **không** chụp `backend/.env`, **không** chụp JWT / refresh token / khóa Gemini.
