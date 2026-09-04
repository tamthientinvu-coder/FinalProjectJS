# HƯỚNG DẪN KIỂM THỬ THỦ CÔNG TOÀN BỘ (V5) — LEARNQUIZ

**Đối tượng:** đúng phần mà môi trường review cloud KHÔNG chạy được — cần Docker Desktop + trình duyệt thật + (tùy chọn) API key Gemini còn hạn mức, đều chỉ có trên máy cha.
**Mốc mã nguồn đã đối chiếu lại:** `3db08fc`, nhánh `main`, ngày 04/09/2026.
**Nguyên tắc:** làm đúng thứ tự — dựng CSDL thật trước, xong mới chạy kịch bản. Mỗi bước có "Kỳ vọng" — lệch kỳ vọng thì dừng lại, ghi vào bảng cuối, không tự đoán là lỗi thao tác.

## Kết quả kiểm tra kỹ thuật ngày 04/09/2026

| Cổng kiểm tra | Kết quả |
|---|---|
| Git | `main` đồng bộ `origin/main`; worktree sạch trước khi cập nhật tài liệu này |
| Backend | toàn bộ suite đạt; lint đạt; build TypeScript đạt |
| Frontend | 13/13 unit test đạt; lint đạt; build production đạt |
| Playwright Chromium | 3/3 ca điều hướng và phân quyền đạt |
| Prisma | schema hợp lệ |
| Docker Compose | cấu hình hợp lệ; PostgreSQL 16 ở cổng 5433, Adminer 8080 |
| Frontend audit | 0 lỗ hổng được npm báo cáo |
| Backend audit | 3 cảnh báo `moderate` qua chuỗi `express -> body-parser -> qs`; cần đánh giá/vá riêng rồi chạy hồi quy |
| Production API | `/health` trả `status=ok`, `db=up` |
| Production frontend | HTTP 200 từ Vercel |

Số lượng test trong `README.md` và `docs/DE-AN.md` đã được đồng bộ về backend 344/344 và frontend 13/13. HTTP 200 production chỉ là smoke hạ tầng, chưa thay thế kiểm thử đăng nhập, CORS, dữ liệu và giao diện bằng trình duyệt.

---

## 0. Chuẩn bị (5 phút)

1. Docker Desktop đang chạy.
2. Mở PowerShell tại `C:\Users\vutam\Desktop\FinalProject`.
3. Cài Playwright browser một lần nếu chưa có (chỉ cần cho việc tự chạy `npm run test:e2e`, không bắt buộc cho phần này):
   ```powershell
   cd frontend
   npx playwright install chromium
   cd ..
   ```

---

## 1. Dựng PostgreSQL thật + backend cục bộ

**Không dùng `docker-compose.full.yml`** cho vòng này (file đó không mở cổng Postgres ra ngoài, không seed sẵn theo ý muốn tại đây). Dùng `docker-compose.yml` (chỉ dựng CSDL) + chạy backend bằng `npm run dev`.

```powershell
# 1) CSDL Postgres tạm, cổng 5433 (không đụng CSDL production trên Render)
docker compose up -d

# 2) Backend
cd backend
copy .env.example .env
# .env.example đã trỏ sẵn DATABASE_URL vào localhost:5433 — không cần sửa gì
# THÊM tay 2 dòng bí mật ngẫu nhiên (không dùng chuỗi mẫu trong .env.example):
#   JWT_ACCESS_SECRET=<chuỗi ngẫu nhiên, ví dụ: openssl rand -hex 32>
#   JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên KHÁC>
# Nếu muốn kiểm mục 4 (Gemini live), điền thêm GEMINI_API_KEY=<key thật>

npx prisma migrate deploy
npm run seed
npm run dev
```

**Kỳ vọng:** log dừng lại ở dòng `Server is running on port 3000`, không có traceback đỏ. Nếu `migrate deploy` báo lỗi — đây chính là nghi vấn drift ở §3.1 kế hoạch review, dừng lại và báo ngay, đừng làm tiếp.

Mở tab mới, kiểm tra sống:
```powershell
curl http://localhost:3000/health
```
**Kỳ vọng:** `{"status":"ok","db":"up"}`.

Chạy frontend (tab thứ ba):
```powershell
cd frontend
copy .env.example .env    # VITE_API_URL=http://localhost:3000/api/v1
npm run dev
```
Mở `http://localhost:5173`.

**Tài khoản mẫu (mật khẩu chung: `123456`)**

| Vai trò | Email |
|---|---|
| Admin | `admin@learnquiz.vn` |
| Giảng viên | `instructor@learnquiz.vn` |
| Giảng viên 2 | `instructor2@learnquiz.vn` |
| Học viên | `student@learnquiz.vn` |
| Học viên 2 | `student2@learnquiz.vn` |

Khóa "JavaScript căn bản cho người mới" (đã published, có 1 quiz "Kiểm tra: Biến và kiểu dữ liệu", 3 câu) là khóa đầu tiên seed tạo ra — trên CSDL vừa seed sạch, gần như chắc chắn có `id = 1`. Xác nhận lại bằng `GET /api/v1/courses` nếu không chắc.

---

## 2. Ba kịch bản E2E qua giao diện thật (bấm tay trên `localhost:5173`)

Ghi lại: Đạt / Không đạt + ảnh chụp màn hình cho mỗi bước có dấu **(!)**.

### Kịch bản 1 — Học viên (S1–S9)

1. Đăng ký tài khoản mới (email bất kỳ, vai trò Học viên) → đăng nhập.
2. Vào trang Khóa học → lọc theo danh mục "Ngôn ngữ lập trình" + trình độ "Người mới bắt đầu" → khóa "JavaScript căn bản" phải xuất hiện.
3. Mở chi tiết khóa → **Đăng ký học**.
4. Vào bài "Biến và kiểu dữ liệu" → học xong → **Đánh dấu hoàn thành**.
5. Kiểm % tiến độ đã tăng đúng (1 / tổng số bài trong khóa).
6. Làm quiz — **cố tình chọn sai 1 câu** (ví dụ câu "typeof null" chọn đáp án khác `"object"`) → nộp.
7. **(!)** Xem lại: câu đúng/sai hiện đúng, và trước khi nộp (mở tab Network, xem response `GET .../quiz`) tuyệt đối không thấy field `isCorrect`.
8. Bấm "Vì sao sai?" ở câu sai → **(!)** nếu đã điền `GEMINI_API_KEY` thật ở bước 1, phải ra lời giải thích trong vài giây; nếu không điền key, nút phải bị làm mờ/báo rõ AI chưa cấu hình — **không được** sập trang hay lỗi 500.
9. Làm lại quiz (đổi đáp án đúng) → đạt (≥70%) → xác nhận nút "Làm lại" **biến mất**.

### Kịch bản 2 — Giảng viên (I1–I5)

Đăng nhập `instructor2@learnquiz.vn` (dùng tài khoản instructor thứ 2 để có thể lặp lại kịch bản T5 ở mục 3 bên dưới).

1. Tạo khóa học mới, **cố tình bỏ trống mô tả** → bấm "Gửi duyệt" → **(!)** phải bị chặn với thông báo rõ ràng (F9).
2. Điền đủ mô tả, ảnh đại diện, danh mục.
3. Thêm 3 bài học → đổi thứ tự bài 1 ↔ bài 3 → xác nhận thứ tự lưu đúng sau khi tải lại trang.
4. Vào một bài → soạn quiz: hoặc gõ tay 4 đáp án/1 đúng, hoặc bấm "Sinh câu hỏi bằng AI" (cần `GEMINI_API_KEY`) → sửa 1 câu → lưu.
5. Gửi duyệt.
6. Đăng nhập `admin@learnquiz.vn` (tab ẩn danh khác) → duyệt khóa này → published.
7. Quay lại tài khoản giảng viên → sửa nội dung một bài học đã published → **(!)** khóa phải tự quay về `draft` (F2) — kiểm bằng cách admin không còn thấy khóa này ở danh sách "đã duyệt" nữa.
8. Thử xóa một bài học **đã có** học viên đánh dấu hoàn thành (dùng khóa "JavaScript căn bản" ở mục 1, tài khoản `instructor@learnquiz.vn`) → **(!)** phải bị chặn 409 (F3 — nhớ: đây chỉ là chặn ở tầng ứng dụng, xem cảnh báo F3 trong báo cáo review).
9. Xem thống kê lớp — số học viên, % trung bình, điểm trung bình hiển thị hợp lý.

### Kịch bản 3 — Quản trị (A1–A4)

Đăng nhập `admin@learnquiz.vn`.

1. Vào hàng đợi duyệt → chọn một khóa `pending` → từ chối với lý do **dưới 10 ký tự** (ví dụ "không đạt") → **(!)** phải bị chặn ở form/API.
2. Từ chối đúng cách (≥10 ký tự) → duyệt một khóa khác.
3. Vào quản lý danh mục → tạo, sửa một danh mục → thử xóa danh mục **đang có khóa học** → **(!)** phải báo lỗi (409).
4. Vào quản lý người dùng → khóa tài khoản `student2@learnquiz.vn` → mở tab ẩn danh, thử đăng nhập bằng tài khoản đó → **(!)** phải bị từ chối.
5. Thử khóa **chính tài khoản admin đang đăng nhập** → **(!)** phải bị chặn (409).
6. Nếu chỉ còn đúng 1 admin `isActive`, thử khóa admin đó bằng một admin khác (nếu có 2 tài khoản admin) → **(!)** phải bị chặn "quản trị viên cuối cùng".
7. Xem dashboard tổng quan — số liệu người dùng/khóa học/lượt nộp bài khớp thực tế.

---

## 3. Mười hai kịch bản tấn công — chạy bằng PowerShell (curl) hoặc Postman

Đăng nhập trước để lấy token (thay email/password nếu cần):

```powershell
$student = (curl -s -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"student@learnquiz.vn","password":"123456"}' | ConvertFrom-Json).data
$studentToken = $student.accessToken

$instructor = (curl -s -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"instructor@learnquiz.vn","password":"123456"}' | ConvertFrom-Json).data
$instructorToken = $instructor.accessToken

$instructor2 = (curl -s -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"instructor2@learnquiz.vn","password":"123456"}' | ConvertFrom-Json).data
$instructor2Token = $instructor2.accessToken

$admin = (curl -s -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@learnquiz.vn","password":"123456"}' | ConvertFrom-Json).data
$adminToken = $admin.accessToken
```

Trước khi bắt đầu, học viên `student@learnquiz.vn` phải đã **enroll** khóa `id=1` (làm qua UI ở Kịch bản 1, hoặc bằng lệnh):
```powershell
curl -s -X POST http://localhost:3000/api/v1/courses/1/enroll -H "Authorization: Bearer $studentToken"
```

**Trước khi chạy T1/T3**, xác nhận đúng ID bài học của khóa `id=1` (đừng tin số 1/2/3 đoán sẵn dưới đây — seed có thể lệch nếu chạy nhiều lần):
```powershell
curl -s http://localhost:3000/api/v1/courses/1/learn -H "Authorization: Bearer $studentToken"
```
Thay số bài/quiz trong bảng dưới bằng ID thật lấy được từ đây.

| # | Lệnh | Kỳ vọng |
|---|---|---|
| **T1** | `curl -s http://localhost:3000/api/v1/lessons/1/quiz -H "Authorization: Bearer $studentToken"` — soi kỹ chuỗi trả về | Không có chữ `isCorrect` ở đâu trong JSON |
| **T2** | `curl -s -X POST http://localhost:3000/api/v1/quiz/1/submit -H "Authorization: Bearer $studentToken" -H "Content-Type: application/json" -d '{"answers":[{"questionId":1,"choiceId":999}],"score":100}'` | Trường `score` gửi lên bị loại bỏ tự động (`stripUnknown`), điểm trả về do server tự chấm — không phải 100 |
| **T3** | Đánh dấu hoàn thành một bài đang khóa (bài 3 khi chưa học bài 1–2): `curl -s -X PATCH http://localhost:3000/api/v1/lessons/3/complete -H "Authorization: Bearer $studentToken" -H "Content-Type: application/json" -d '{}'` | `403`, không tạo `LessonProgress` |
| **T4** | `curl -s -X POST http://localhost:3000/api/v1/courses/1/enroll -H "Authorization: Bearer $instructorToken"` | `403` (F6 — role student mới enroll được) |
| **T5** | Dùng token `instructor2Token` sửa khóa của `instructor` (khóa `id=1` là của `instructor`, không phải `instructor2`): `curl -s -X PATCH http://localhost:3000/api/v1/courses/1 -H "Authorization: Bearer $instructor2Token" -H "Content-Type: application/json" -d '{"title":"chiếm quyền"}'` | `403` |
| **T6** | `curl -s -X PATCH http://localhost:3000/api/v1/courses/1/publish -H "Authorization: Bearer $instructorToken"` | `403` (chỉ admin publish được, kể cả instructor là chủ khóa) |
| **T7** | Cần token admin: `curl -s http://localhost:3000/api/v1/users -H "Authorization: Bearer $adminToken"` — soi JSON | Không có `password` hay `refreshToken` |
| **T8** | `curl -s -X POST http://localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"name":"Kẻ gian","email":"hacker@test.vn","password":"123456","role":"admin"}'` | `400` — yup từ chối vì `role` chỉ nhận `student`/`instructor` (mạnh hơn "hạ cấp âm thầm": chặn thẳng ở validate) |
| **T9** | Chạy 2 lệnh gần như đồng thời (2 cửa sổ PowerShell bấm gần nhau) cùng enroll khóa `id=2` bằng cùng 1 học viên chưa enroll khóa đó | Đúng 1 bản ghi enrollment; request thứ 2 nhận lỗi trùng (409/500 tùy tầng bắt) — ràng buộc `@@unique([studentId, courseId])` đảm bảo |
| **T10** | Seed chỉ có 1 admin — không có endpoint "đổi vai trò" trong code, phải tạo admin thứ 2 bằng tay: `npx prisma studio` (backend) → mở bảng `users` → đổi `role` của `student2@learnquiz.vn` (hoặc bất kỳ user nào) thành `admin`. Xong thì: từ admin A, khóa admin B; gần như đồng thời từ admin B, khóa admin A | Sau cùng vẫn còn ≥1 admin `isActive = true` — không được cả 2 cùng bị khóa |
| **T11** | Sau khi đã có ít nhất 1 lượt nộp bài cho quiz `id=1`: `curl -s -X PATCH http://localhost:3000/api/v1/quiz/1 -H "Authorization: Bearer $instructorToken" -H "Content-Type: application/json" -d '{"passScore":99}'` | `409` |
| **T12** | Sửa 1 ký tự trong `$studentToken` rồi gọi `curl -s http://localhost:3000/api/v1/auth/me -H "Authorization: Bearer <token_da_sua>"` | `401` |

**Ghi chú khi đọc kết quả:** nếu một lệnh trả JSON có `"success": false` thì đó **là** kết quả mong đợi cho các dòng ghi 403/409/400/401 ở trên — không phải lỗi hệ thống.

---

## 4. Gemini sống (chỉ khi đã điền `GEMINI_API_KEY` thật ở mục 1)

1. Gọi thật 1 lần mỗi tính năng: "Sinh câu hỏi bằng AI" (giảng viên), "Vì sao sai?" (học viên, Kịch bản 1 bước 8), "Tóm tắt bài học" (nếu có nút này trên UI).
2. Bấm "Vì sao sai?" **lần thứ hai** cho đúng câu đó → phải ra ngay lập tức (không delay như gọi mạng thật) — nghĩa là đọc từ `Answer.aiExplanation` đã lưu, không gọi lại Gemini.
3. Trong `.env` backend, xóa tạm `GEMINI_API_KEY`, khởi động lại (`npm run dev`) → vào lại trang quiz → nút AI phải bị mờ/ẩn có lý do, **không** làm sập trang hay lỗi 500 chỗ khác.
4. Xác nhận `gemini-3.6-flash` (biến `GEMINI_MODEL` trong `.env`) vẫn còn được Google hỗ trợ tại ngày kiểm — tra `https://ai.google.dev/gemini-api/docs/deprecations`.

---

## 5. Smoke production thật (không ghi dữ liệu — chỉ đọc)

Chạy trên máy, không cần Docker:

```powershell
curl https://learnquiz-api.onrender.com/health
```
**Kỳ vọng:** `{"status":"ok","db":"up"}`.

Mở `https://final-project-js-ten.vercel.app` trên trình duyệt, F12 → tab Console, tải lại trang → không có dòng đỏ nào nhắc CORS.

**Tuyệt đối không** chạy `npm run seed:prod` hoặc bất kỳ lệnh ghi nào nhắm vào `learnquiz-api.onrender.com` hay CSDL Render. Nhắc lại cảnh báo đã ghi trong `DEPLOY.md`: CSDL Render Free được ghi nhận hết hạn **~27/09/2026** — xác nhận ngày bảo vệ nằm trước mốc này.

---

## 5bis. Quy tắc an toàn và cách ghi bằng chứng

### 5bis.1. An toàn dữ liệu

1. `backend/prisma/seed.ts` xóa dữ liệu khóa học, bài học, đăng ký, tiến độ, bài nộp và đáp án trước khi tạo lại. Chỉ seed CSDL local hoặc CSDL tạm được phép xóa.
2. Không chạy `npm run seed:prod` nếu chưa xác nhận CSDL production rỗng hoặc có thể hủy.
3. Không thử khóa user, xóa category, nộp dữ liệu giả hoặc test đồng thời trên production.
4. Không chụp hoặc dán JWT, refresh token, Gemini key, DATABASE_URL và secret vào báo cáo.
5. Không tin sẵn `courseId=1`, `lessonId=1`, `quizId=1`; luôn lấy ID thật từ URL, Network hoặc API.

### 5bis.2. Trạng thái ca kiểm thử

- `PASS`: kết quả đúng hoàn toàn.
- `FAIL`: khác kỳ vọng và tái hiện được.
- `BLOCKED`: không chạy được vì môi trường hoặc ca trước thất bại.
- `NOT RUN`: chưa thực hiện.

Với mỗi `FAIL`, ghi commit, local/production, trình duyệt, kích thước màn hình, vai trò, điều kiện đầu, bước tái hiện, kết quả thực tế, kết quả mong đợi, ảnh/video và request/response Network đã che bí mật.

---

## 6. Kiểm tra trang công khai, xác thực và phiên đăng nhập

### P1 — Trang chủ và menu

1. Mở cửa sổ ẩn danh ở `http://localhost:5173`.
2. Nhấn `Ctrl+F5`, mở Console và Network.
3. Kiểm tra logo, menu, nội dung chính, link đăng nhập/đăng ký.
4. Nhấn logo từ một trang con.

**Kỳ vọng:** trang không trắng; logo về `/`; không có lỗi đỏ; khách không thấy thao tác riêng của Student/Instructor/Admin.

### P2 — Danh sách khóa học

1. Mở `/courses` khi chưa đăng nhập.
2. Tìm `JavaScript`.
3. Chọn category `Ngôn ngữ lập trình` và level `Người mới bắt đầu`.
4. Đổi sắp xếp mới nhất/cũ nhất/theo tên nếu giao diện có.
5. Xóa từng bộ lọc và thử từ khóa không có kết quả.

**Kỳ vọng:** chỉ khóa `published` xuất hiện; nhiều bộ lọc kết hợp đúng; trạng thái rỗng rõ ràng; xóa lọc khôi phục danh sách; phân trang không lặp/mất khóa.

### P3 — Chi tiết khóa khi là khách

1. Mở khóa JavaScript.
2. Kiểm tra tên, mô tả, ảnh, category, level, instructor và tiêu đề bài học.
3. Thử bắt đầu học và gõ trực tiếp `/learn/<courseId>`.

**Kỳ vọng:** dữ liệu công khai hiện đúng; nội dung/video bài chưa bị lộ; route cần đăng nhập đưa về `/login`.

### P4 — Route không tồn tại

Mở `/duong-dan-khong-ton-tai-qa`, sau đó dùng nút về trang chủ.

**Kỳ vọng:** trang 404 thân thiện, không stack trace; nút hoạt động.

### AU1 — Đăng ký hợp lệ

1. Mở `/register`.
2. Đăng ký Student mới, tên từ 2 ký tự, email mới, mật khẩu từ 6 ký tự.
3. Lặp lại với Instructor mới.

**Kỳ vọng:** tạo đúng role; không có lựa chọn Admin; email được chuẩn hóa; Instructor vào được `/instructor/courses`, Student vào được `/my-courses`.

### AU2 — Validation đăng ký

Thử riêng từng dữ liệu:

| Dữ liệu | Kỳ vọng |
|---|---|
| Tên trống hoặc 1 ký tự | báo bắt buộc/tối thiểu 2 ký tự |
| Email sai định dạng | báo email không hợp lệ |
| Email đã tồn tại | báo xung đột thân thiện, không 500 |
| Mật khẩu 5 ký tự | báo tối thiểu 6 ký tự |
| Sửa request thành `role=admin` | 400; không tạo Admin |

### AU3 — Đăng nhập, đăng xuất và Back

1. Đăng nhập lần lượt ba vai trò seed.
2. Mỗi lần kiểm tra tên, role, menu và dashboard.
3. Đăng xuất rồi nhấn Back.

**Kỳ vọng:** điều hướng đúng vai trò; logout xóa phiên; Back không mở lại dữ liệu bảo vệ.

### AU4 — Không dò được email

Thử email không tồn tại và email đúng/mật khẩu sai.

**Kỳ vọng:** hai trường hợp dùng thông báo chung; không tiết lộ email nào tồn tại.

### AU5 — Ma trận route bảo vệ

| Người dùng | URL | Kỳ vọng |
|---|---|---|
| Khách | `/my-courses` | về `/login` |
| Instructor | `/my-courses` | về `/403` |
| Student | `/instructor/courses` | về `/403` |
| Student/Instructor | `/admin`, `/admin/users` | về `/403` |
| Admin | `/admin`, `/instructor/courses` | vào được |

### AU6 — Refresh token

1. Đăng nhập Student, mở DevTools Network.
2. Chờ access token hết hạn hoặc dùng cấu hình local có thời hạn ngắn.
3. Mở trang tạo nhiều request đồng thời.
4. Lặp lại khi refresh token sai/hết hạn.

**Kỳ vọng:** chỉ một request refresh phục vụ hàng đợi; request chờ tiếp tục; refresh thất bại thì toàn bộ hàng đợi bị reject và user trở về login, không treo vô hạn.

---

## 7. Kiểm tra Học viên chi tiết

Ngoài Kịch bản 1 ở mục 2, chạy thêm các ca sau.

### S10 — Enroll và chống bấm lặp

1. Chọn một khóa chưa enroll.
2. Mở Network, nhấn nhanh `Đăng ký học` hai lần.
3. Reload và mở `Khóa học của tôi`.

**Kỳ vọng:** đúng một enrollment; request thứ hai bị chặn có kiểm soát; không 500; tiến độ ban đầu hợp lý.

### S11 — Lộ trình học ở cả UI và API

1. Khi chưa hoàn thành bài 1, thử mở bài 2 bằng menu.
2. Gõ URL/API trực tiếp của bài 2.
3. Hoàn thành bài 1, mở bài 2.
4. Bỏ hoàn thành bài 1 và thử lại.

**Kỳ vọng:** backend chặn đường vòng; hoàn thành bài trước mở bài sau; bỏ hoàn thành khóa lại các bài phụ thuộc; lịch sử quiz cũ không bị xóa.

### S12 — Tiến độ

1. Ghi tổng số bài `N`.
2. Hoàn thành lần lượt từng bài, sau mỗi lần reload trang học và `Khóa học của tôi`.
3. Bỏ hoàn thành một bài.

**Kỳ vọng:** phần trăm bằng `số bài hoàn thành / N`; bền vững sau reload; không NaN, âm hoặc trên 100%; 100% chỉ khi đủ bài.

### S13 — Quiz, lượt làm và điểm tốt nhất

1. Trước khi nộp, tìm `isCorrect` và từ `correct` trong response GET quiz.
2. Làm một lượt thấp điểm, một lượt cao hơn nhưng chưa đạt, rồi một lượt đạt.
3. Kiểm số lượt, `canAttempt`, nút Làm lại và điểm trong `Khóa học của tôi`.
4. Dùng Student 2 gõ URL kết quả của Student 1.

**Kỳ vọng:** không lộ đáp án trước nộp; attemptNo tăng; dùng điểm tốt nhất để tổng hợp; sau đạt không làm lại; Student 2 nhận 403.

### S14 — Trạng thái nội dung bất thường

Kiểm bài không video, quiz không tồn tại, khóa không có bài và mạng bị ngắt lúc tải.

**Kỳ vọng:** empty/error/loading state rõ ràng; không màn hình trắng, không khung video hỏng và không loading vô hạn.

---

## 8. Kiểm tra Giảng viên chi tiết

Ngoài Kịch bản 2 ở mục 2, chạy thêm:

### I10 — CRUD khóa và validation biên

1. Tạo khóa với tên 4 ký tự, thumbnail sai URL và category không hợp lệ.
2. Tạo hợp lệ với tên từ 5 ký tự, mô tả, thumbnail, category và level.
3. Reload, sửa khóa của mình.
4. Instructor 2 gõ URL sửa khóa của Instructor 1.

**Kỳ vọng:** dữ liệu sai bị chặn đúng trường; khóa mới là `draft`; dữ liệu bền vững; sửa khóa người khác bị 403 ở backend.

### I11 — CRUD và sắp xếp bài

1. Tạo ba bài A-B-C; thử tiêu đề 2 ký tự và video URL sai.
2. Đổi thành C-A-B, reload và xem bằng Student.
3. Sửa bài B.
4. Hủy một dialog xóa; xác nhận xóa một bài chưa có lịch sử.

**Kỳ vọng:** validation đúng; thứ tự nhất quán và không trùng; Hủy không xóa; thao tác được lưu sau reload.

### I12 — Validation quiz đầy đủ

Thử: 3/5 đáp án; 0/2 đáp án đúng; câu dưới 5 ký tự; quiz rỗng; passScore -1/101; maxAttempts 0/21; sau đó lưu dữ liệu hợp lệ.

**Kỳ vọng:** mỗi câu đúng 4 đáp án và đúng 1 đáp án đúng; quiz 1–50 câu; passScore 0–100; maxAttempts rỗng hoặc 1–20.

### I13 — Lịch sử đã phát sinh

1. Cho Student nộp quiz và hoàn thành bài.
2. Thử sửa câu/đáp án, đổi passScore, xóa quiz, xóa bài và xóa khóa liên quan.
3. Thử sửa metadata được phép như tên quiz/số lượt.

**Kỳ vọng:** không hard-delete hoặc thay đổi quy tắc làm sai lịch sử; thao tác bị chặn 409; metadata được phép vẫn lưu; bài nộp cũ còn đọc được.

### I14 — Thống kê lớp

1. Chuẩn bị hai Student có tiến độ và điểm khác nhau.
2. Đối chiếu số enroll, số bài, số quiz, tổng lượt nộp, tiến độ trung bình, điểm trung bình, điểm cao nhất và tỷ lệ đạt.
3. Instructor khác mở URL thống kê; Admin mở lại.

**Kỳ vọng:** số liệu tính tay khớp; Instructor khác 403; Admin xem được; lớp rỗng hiện 0/null hợp lý, không NaN.

---

## 9. Kiểm tra Quản trị chi tiết

Ngoài Kịch bản 3 ở mục 2, chạy thêm:

### A5 — Dashboard

Đếm user theo role, khóa theo status, enroll, submission và top khóa nhiều học viên; đối chiếu với dữ liệu vừa tạo.

**Kỳ vọng:** số liệu nhất quán; khóa chưa published không lọt vào top public; dữ liệu rỗng không NaN.

### A6 — Hàng đợi và máy trạng thái

1. Lọc/tìm theo tên khóa và Instructor.
2. Duyệt pending, thử duyệt lại published.
3. Từ chối không lý do, lý do 9 ký tự, rồi lý do 10–500 ký tự.
4. Gỡ published thiếu lý do rồi gỡ với lý do hợp lệ.

**Kỳ vọng:** chỉ pending được duyệt/từ chối; lý do ngắn bị 400; published → draft khi gỡ; lý do được lưu và Instructor nhìn thấy.

### A7 — Category

1. Tạo tên từ 2 ký tự, để slug trống.
2. Tạo slug thủ công chỉ chữ thường, số, gạch ngang.
3. Thử slug có dấu cách, chữ hoa, tiếng Việt, ký tự đặc biệt và slug trùng.
4. Sửa; xóa category rỗng; thử xóa category đang có khóa.

**Kỳ vọng:** slug tự sinh đúng; slug sai/trùng bị chặn; category rỗng xóa được; category đang dùng bị 409.

### A8 — User và thu hồi phiên

1. Tìm/lọc user theo tên, email, role và active.
2. Kiểm response không có `password`/`refreshToken`.
3. Khóa Student 2 đang đăng nhập ở tab khác; dùng access token cũ gọi API; thử refresh và login.
4. Mở khóa rồi login lại.

**Kỳ vọng:** token cũ bị chặn ngay; refresh token bị thu hồi; login bị từ chối khi khóa; mở khóa khôi phục truy cập.

---

## 10. Khả năng chịu lỗi, responsive và accessibility

### R1 — Backend/DB gián đoạn

1. Đang ở danh sách khóa, dừng backend local rồi thao tác.
2. Khởi động lại và thử lại.
3. Dừng riêng DB, gọi `/health` và API dữ liệu, sau đó khởi động lại.

**Kỳ vọng:** UI báo lỗi mạng thân thiện; không trắng/treo; health phản ánh DB down; không lộ stack hoặc connection string; phục hồi được.

### R2 — Double-click

Bấm nhanh hai lần ở đăng nhập, đăng ký, enroll, hoàn thành bài, nộp quiz, lưu course/lesson/quiz và duyệt khóa.

**Kỳ vọng:** nút disable/loading; không có dữ liệu trùng hoặc chuyển trạng thái hai lần.

### R3 — Reload/deep link

Reload trực tiếp mọi route chính ở local preview và Vercel.

**Kỳ vọng:** SPA rewrite hoạt động; không 404 web server; phiên và quyền khôi phục đúng.

### U1 — Ma trận màn hình

Chạy trang login, register, course list/detail, learn, quiz/result, instructor editor/stats và bốn trang admin ở 360x800, 390x844, 768x1024 và 1366x768.

**Kỳ vọng:** không cuộn ngang ngoài chủ đích; nút/dialog không bị che; bảng xem được; chuỗi dài không phá layout.

### U2 — Bàn phím và focus

Chỉ dùng Tab/Shift+Tab/Enter/Space/Escape qua form, menu và dialog.

**Kỳ vọng:** focus nhìn thấy; thứ tự hợp lý; focus nằm trong dialog; Escape/Hủy không chạy thao tác phá hủy.

### U3 — Zoom, label và màu

Zoom 200%, submit form rỗng và xem trạng thái đúng/sai quiz.

**Kỳ vọng:** không chồng chữ; input có label; lỗi gắn đúng trường; đúng/sai không chỉ phân biệt bằng màu.

### U4 — XSS và chuỗi dài

Trên local, nhập tiếng Việt, dấu nháy, `<script>alert(1)</script>` và chuỗi sát giới hạn vào tên/mô tả/nội dung.

**Kỳ vọng:** hiển thị như văn bản, không chạy script; giới hạn ký tự đúng; layout không vỡ.

---

## 11. Cổng chất lượng phải chạy trên đúng commit

```powershell
cd C:\Users\vutam\Desktop\FinalProject\backend
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npm run build
rtk npx prisma validate
rtk npm audit --audit-level=high

cd C:\Users\vutam\Desktop\FinalProject\frontend
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npm run test:e2e
rtk npm run build
rtk npm audit --audit-level=high
```

**Tiêu chí:** không lint/type/build error; backend đạt toàn suite; frontend 13/13; Playwright 3/3; Prisma hợp lệ; không critical/high vulnerability. Mọi moderate phải có quyết định vá hoặc chấp nhận rủi ro có lý do. Nếu chạy `npm audit fix`, phải kiểm diff/lockfile rồi chạy lại toàn bộ cổng.

---

## 12. Ma trận truy vết yêu cầu tốt nghiệp

| Yêu cầu | Ca xác nhận |
|---|---|
| Student xem/lọc khóa | P2 |
| Enroll miễn phí | S1–S3, S10, T9 |
| Học theo thứ tự | S4–S5, S11, T3 |
| Tiến độ | S5, S12 |
| Quiz và chấm server | S6–S9, S13, T1–T2 |
| AI giải thích sai | S8, mục 4 |
| Instructor CRUD khóa/bài | I1–I5, I10–I11 |
| Instructor tạo quiz | I4, I12–I13 |
| Instructor thống kê | I9, I14 |
| Admin duyệt khóa | A1–A2, A6 |
| Admin category | A3, A7 |
| Admin user/thống kê | A4–A8 |
| Phân quyền/bảo mật | AU5, T1–T12 |
| Docker/production | mục 1, 5 và 11 |

---

## 13. Bảng ghi kết quả (tự điền tay)

| Mục | Đạt / Không đạt | Ghi chú |
|---|---|---|
| V4.1 — Dựng Postgres + migrate deploy | | |
| Kịch bản 1 — Học viên | | |
| Kịch bản 2 — Giảng viên | | |
| Kịch bản 3 — Quản trị | | |
| T1–T12 | | ghi rõ số nào không đạt |
| Gemini sống | | |
| Smoke production | | |

### Tổng hợp toàn bộ V5

| Nhóm | PASS | FAIL | BLOCKED | NOT RUN | Ghi chú |
|---|---:|---:|---:|---:|---|
| Public | | | | | |
| Auth/Session | | | | | |
| Student | | | | | |
| Instructor | | | | | |
| Admin | | | | | |
| API/Security | | | | | |
| Gemini | | | | | |
| Resilience | | | | | |
| UI/Responsive/Accessibility | | | | | |
| Production | | | | | |

Chỉ kết luận **đủ để bảo vệ** khi không còn Blocker/Critical ở yêu cầu bắt buộc; ba vai trò hoàn tất luồng chính; chấm điểm server và không lộ đáp án được chứng minh qua Network/API; quyền sở hữu được chứng minh bằng request trực tiếp; và test/lint/build/Prisma đạt trên cùng commit.

Chỉ kết luận **production-ready** khi ngoài các điều kiện trên còn có kiểm thử PostgreSQL/hosted thực, Gemini live, dependency risk đã xử lý, cấu hình dashboard Render/Vercel được xác minh và có phương án dữ liệu phù hợp.

Xong bảng này, gửi lại đây (chụp ảnh hoặc gõ tay kết quả) — tôi cập nhật vào `docs/DE-AN.md`/`docs/BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md` và đổi kết luận từ "Đủ để bảo vệ, chưa đủ để tuyên bố production-ready" sang "Đạt đầy đủ" nếu mọi mục đều xanh — hoặc ghi finding mới nếu có mục không đạt.

---

*Soạn lần đầu ngày 02/09/2026; mở rộng và kiểm tra lại ngày 04/09/2026 trên commit `3db08fc` (route, schema, seed, test, build, Prisma, Docker config và smoke production).*
