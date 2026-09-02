# HƯỚNG DẪN KIỂM TRA BẰNG TAY (V4) — LEARNQUIZ

**Đối tượng:** đúng phần mà môi trường review cloud KHÔNG chạy được — cần Docker Desktop + trình duyệt thật + (tùy chọn) API key Gemini còn hạn mức, đều chỉ có trên máy cha.
**Mốc mã nguồn áp dụng:** `e99e1d4` (đã push) hoặc mới hơn.
**Nguyên tắc:** làm đúng thứ tự — dựng CSDL thật trước, xong mới chạy kịch bản. Mỗi bước có "Kỳ vọng" — lệch kỳ vọng thì dừng lại, ghi vào bảng cuối, không tự đoán là lỗi thao tác.

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

## 6. Bảng ghi kết quả (tự điền tay)

| Mục | Đạt / Không đạt | Ghi chú |
|---|---|---|
| V4.1 — Dựng Postgres + migrate deploy | | |
| Kịch bản 1 — Học viên | | |
| Kịch bản 2 — Giảng viên | | |
| Kịch bản 3 — Quản trị | | |
| T1–T12 | | ghi rõ số nào không đạt |
| Gemini sống | | |
| Smoke production | | |

Xong bảng này, gửi lại đây (chụp ảnh hoặc gõ tay kết quả) — tôi cập nhật vào `docs/DE-AN.md`/`docs/BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md` và đổi kết luận từ "Đủ để bảo vệ, chưa đủ để tuyên bố production-ready" sang "Đạt đầy đủ" nếu mọi mục đều xanh — hoặc ghi finding mới nếu có mục không đạt.

---

*Soạn ngày 02/09/2026, dựa trên code thật đã đọc trực tiếp ở commit `e99e1d4` (route, schema, response envelope) — không suy đoán từ tài liệu cũ.*
