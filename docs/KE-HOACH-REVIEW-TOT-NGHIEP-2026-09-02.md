# KẾ HOẠCH REVIEW MÃ NGUỒN & KIỂM TRA ĐIỀU KIỆN TỐT NGHIỆP — LEARNQUIZ

**Ngày lập:** 02/09/2026
**Phạm vi:** toàn bộ `C:\Users\vutam\Desktop\FinalProject` (monorepo `backend/` + `frontend/` + `docs/` + hạ tầng)
**Mốc mã nguồn:** `b5b18dc` — *fix: complete graduation hardening* (nhánh `main`, worktree sạch)
**Đối chiếu chuẩn:** `ĐỀ TÀI 4 — Nền Tảng Học Tập & Quiz Trực Tuyến.docx` (thang 10: Student 4.0 / Instructor 4.0 / Admin 2.0) + `docs/DE-AN.md` + Checklist Bài 11 Capstone Prep

> **Đây là KẾ HOẠCH. Không có bước nào trong tài liệu này đã được thực hiện.**
> Tài liệu chỉ định nghĩa: review cái gì, bằng phương pháp nào, bằng chứng nào được chấp nhận, và tiêu chí đạt/không đạt.

---

## 0. Bối cảnh — vì sao cần vòng review thứ hai

Dự án đã qua hai vòng tài liệu:

| Mốc | Tài liệu | Kết luận tại thời điểm đó |
|---|---|---|
| `c4b99d0` | `REVIEW-TOT-NGHIEP-2026-09-01.md` | Đủ chức năng, nhưng 12 finding F1–F12 (5 nhóm P1) chưa xử lý |
| `b5b18dc` | `BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md` | F1–F12 tuyên bố "Đóng"; 344/344 test; còn 4 ô checklist chưa tick |

Vòng review lần này **không lặp lại** vòng trước. Nhiệm vụ của nó là ba việc mà vòng trước tự nhận là chưa làm được:

1. **Kiểm chứng độc lập** rằng F1–F12 thật sự đóng bằng code, không phải chỉ đóng bằng lời trong báo cáo.
2. **Truy quét vùng mù** mà bộ test hiện tại (Prisma giả lập trong bộ nhớ) về bản chất không thể chạm tới.
3. **Chốt hồ sơ nộp** (DOCX/PPTX/demo) ở trạng thái không còn placeholder.

**Nguyên tắc bằng chứng xuyên suốt:** không công nhận `README`, `DE-AN.md` hay báo cáo tự khai là bằng chứng. Chỉ công nhận (a) dòng code đã đọc, (b) output lệnh đã chạy, (c) ảnh chụp màn hình thao tác thật.

---

## 1. Bản đồ đối tượng review

Số liệu khảo sát nhanh tại mốc `b5b18dc`:

| Khối | Quy mô | Ghi chú |
|---|---|---|
| `backend/src` | 57 tệp TS (controllers 8, services 14, routes 11, middleware 8, schemas 7) | ~10.555 dòng TS/TSX toàn repo |
| `backend/tests` | 11 tệp, 1.425 dòng | Tự khai 344 phép khẳng định |
| `backend/prisma` | `schema.prisma` + **1 migration duy nhất** (`20260814041600_init`) | ⚠️ điểm nghi vấn số 1, xem §3.1 |
| `frontend/src` | 57 tệp TS/TSX (pages 21, api 10, 4 tệp `*.test.ts`) | |
| `frontend/e2e` | 1 tệp `role-routing.spec.ts` | Smoke, API mock |
| Hạ tầng | `ci.yml`, `production-smoke.yml`, `uptime-ping.yml`, `render.yaml`, `vercel.json`, 3 Dockerfile/compose | |
| Hồ sơ | DOCX + PDF báo cáo, PPTX + PDF slide, 8 tệp `.md` trong `docs/` | |

---

## 2. Sáu vòng review — thứ tự bắt buộc

Thứ tự này không tùy tiện: mỗi vòng chỉ có nghĩa nếu vòng trước đã xanh. Chạy test khi typecheck còn đỏ là lãng phí; kiểm hồ sơ khi số test còn đổi là phải làm lại.

| Vòng | Tên | Mục tiêu | Thời lượng dự kiến | Đầu ra |
|---|---|---|---|---|
| **V0** | Tái lập môi trường & release gate | Có một baseline chạy được, mọi con số về sau đối chiếu vào đây | 45 phút | Bảng gate + log lệnh |
| **V1** | Đối chiếu ma trận đề tài | Chứng minh từng gạch đầu dòng của đề có code tương ứng | 90 phút | Ma trận 18 yêu cầu |
| **V2** | Kiểm chứng độc lập F1–F12 | Xác nhận/bác bỏ tuyên bố "Đóng" của báo cáo khắc phục | 90 phút | Bảng verdict 12 dòng |
| **V3** | Truy quét vùng mù | Tìm lỗi lớp mới mà test giả lập không thấy | 120 phút | Danh sách finding mới |
| **V4** | Kiểm định vận hành thật | Chạy trên PostgreSQL thật + Gemini thật + 3 vai trò | 120 phút | Nhật ký E2E + ảnh chụp |
| **V5** | Chốt hồ sơ bảo vệ | DOCX/PPTX/demo không còn placeholder, số liệu đồng nhất | 60 phút | Checklist nộp |

Tổng: ~8,5 giờ làm việc thực. Có thể cắt V4 xuống 45 phút nếu chấp nhận rủi ro ở §7.

---

## 3. V0 — Tái lập môi trường & release gate

### 3.1. Câu hỏi mở phải trả lời trước tiên (ưu tiên cao nhất)

**Nghi vấn drift giữa `schema.prisma` và thư mục `migrations/`.**
Thư mục `backend/prisma/migrations/` chỉ có đúng **một** migration `20260814041600_init` ngày 14/08. Nhưng đợt khắc phục F1–F12 (01/09) tuyên bố đã thêm ràng buộc chống hard-delete, chính sách mutation, transaction Serializable... Nếu bất kỳ thay đổi nào trong số đó chạm tới `schema.prisma` mà không sinh migration mới, thì:

- CSDL production trên Render **không có** cấu trúc mà code đang giả định;
- `npx prisma validate` vẫn xanh (nó chỉ kiểm cú pháp schema, không so với migration);
- lỗi chỉ nổ ra lúc chạy thật — tức là **giữa buổi bảo vệ**.

**Cách kiểm (lệnh dự kiến, chạy ở V0 bước 4):**

```bash
cd backend
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma \
  --shadow-database-url "postgresql://..." \
  --exit-code
```

- Exit code `0` → không drift → ghi nhận Đạt, đóng nghi vấn.
- Exit code `2` → **có drift** → nâng thành finding P1, phải sinh migration và deploy lại trước bảo vệ.

Song song, đối chiếu `git log --follow -- backend/prisma/schema.prisma` với danh sách migration để xem schema có bị sửa sau ngày 14/08 hay không.

### 3.2. Bảng gate cần chạy lại từ đầu

Không tin số trong báo cáo cũ. Chạy lại toàn bộ, ghi lại **exit code** và **con số thật**.

| # | Gate | Lệnh | Kỳ vọng | Nếu lệch |
|---|---|---|---|---|
| 1 | Worktree sạch | `git status --porcelain` | rỗng | Dừng, hỏi chủ dự án |
| 2 | Đồng bộ remote | `git log --oneline origin/main..main` | rỗng | Ghi nhận số commit chưa push |
| 3 | Cài đặt sạch | `npm ci` (cả 2 app) | Đạt | Kiểm `package-lock.json` |
| 4 | **Prisma drift** | §3.1 | exit 0 | **P1** |
| 5 | Prisma validate | `npx prisma validate` | Đạt | |
| 6 | BE lint | `npm run lint` | 0 warning | |
| 7 | BE typecheck | `npm run typecheck` | Đạt | |
| 8 | BE test | `npm test` | **344/344**, exit 0 | Số ≠ 344 → hồ sơ sai, xem V5 |
| 9 | BE build | `npm run build` | Đạt | |
| 10 | FE lint | `npm run lint` | 0 warning | |
| 11 | FE typecheck | `npm run typecheck` | Đạt | |
| 12 | FE unit test | `npm test` | **13/13** | |
| 13 | FE E2E smoke | `npm run test:e2e` | **3/3** | |
| 14 | FE build | `npm run build` | main ≈ **323,96 kB** | Lệch > 10% → điều tra |
| 15 | Audit BE | `npm audit --omit=dev` | 0 vuln | |
| 16 | Audit FE | `npm audit --omit=dev` | 0 vuln | |
| 17 | Lịch sử `.env` | `git log --all --full-history -- '*/.env'` | rỗng | **P0 nếu có** |

### 3.3. Lưu ý riêng về cách chạy test

`backend/package.json` khai `test` là **một chuỗi 11 lệnh `ts-node` nối bằng `&&`**. Hệ quả cần ghi nhận khi review, không phải lỗi:

- Tệp đầu tiên đỏ thì 10 tệp sau **không chạy** → tổng số phép khẳng định báo cáo được có thể thấp hơn thực tế khi có lỗi.
- Không có test runner → không có coverage, không có `--bail`, không chạy song song.
- **Việc cần làm ở V3:** đánh giá xem có nên đề xuất chuyển sang một runner (vitest/node:test) hay giữ nguyên vì đơn giản, dễ trình bày khi bảo vệ. Đây là *khuyến nghị*, không phải finding chặn tốt nghiệp.

---

## 4. V1 — Đối chiếu ma trận yêu cầu đề tài

Mỗi ô trong ma trận phải điền **ba** thứ, thiếu một là chưa đạt:
`Trạng thái` · `Tệp:dòng của code thực thi` · `Tệp:dòng của test bảo vệ nó`

### 4.1. Student — 4.0 điểm (9 yêu cầu)

| # | Yêu cầu | Điểm cần soi khi review |
|---|---|---|
| S1 | Danh sách + filter category/level | `courseService.listPublished` — khẳng định query **luôn** ép `status = published`, không có nhánh nào bỏ qua |
| S2 | Enroll khóa miễn phí | Ràng buộc `@@unique([studentId, courseId])` + `authorize("student")` ở route + guard ở service (F6) |
| S3 | Học tuần tự video/text | `lessonRules.computeUnlock` được gọi ở **cả hai** chỗ: dựng danh sách và trả nội dung một bài |
| S4 | Đánh dấu hoàn thành | `markComplete` phải kiểm unlock trước khi ghi (đây là F1) |
| S5 | Làm quiz, chấm điểm ngay | `quizGrader` là hàm thuần; controller **không** nhận `score` từ client |
| S6 | Xem lại đúng/sai sau nộp | `GET /lessons/:id/quiz` không rò `isCorrect`; `GET /submissions/:id` mới trả |
| S7 | Tiến độ % + điểm trung bình | Tính từ dữ liệu, không có cột `progressPercent` lưu sẵn |
| S8 | Làm lại nếu chưa đạt | `maxAttempts` + `attemptNo` + chặn làm lại sau khi đạt (F7) |
| S9 | AI giải thích đáp án sai | `aiService.explainWrongAnswer` + cache vào `Answer.aiExplanation` |

### 4.2. Instructor — 4.0 điểm (5 yêu cầu)

| # | Yêu cầu | Điểm cần soi |
|---|---|---|
| I1 | Tạo khóa đủ trường | Ràng buộc completeness khi submit-for-review (F9) |
| I2 | Thêm bài học, thứ tự quan trọng | `@@unique([courseId, order])` + reorder transaction hai pha |
| I3 | Tạo quiz 4 đáp án/1 đúng | Yup schema dùng chung cho cả người gõ tay lẫn output AI |
| I4 | Thống kê lớp học | `groupBy` + `_avg`, đối chiếu công thức điểm trung bình |
| I5 | Sửa/xóa bài học, câu hỏi | Chặn hard-delete khi đã có progress/submission (F3) |

### 4.3. Admin — 2.0 điểm (4 yêu cầu)

| # | Yêu cầu | Điểm cần soi |
|---|---|---|
| A1 | Duyệt trước khi public | `courseWorkflow` — 16 tổ hợp trạng thái × thao tác |
| A2 | CRUD category | 5 endpoint + chặn 409 khi category còn khóa học |
| A3 | Khóa tài khoản | Thu hồi refresh token + invariant "còn ≥1 admin hoạt động" |
| A4 | Thống kê tổng quan | Top 5 khóa nhiều học viên nhất |

### 4.4. Kiểm tra phạm vi phủ định

Đề tài có phần "ngoài phạm vi" đã tuyên bố (thanh toán, upload video, chat, mobile native, quiz tự luận). Review phải xác nhận: **không có code nửa vời** cho các mục này còn sót lại trong repo (route chết, component không dùng, cột CSDL thừa). Code chết là điểm trừ khi bảo vệ, vì hội đồng sẽ hỏi "cái này để làm gì".

Lệnh dự kiến: `npx ts-prune` (hoặc `eslint` rule `no-unused-vars` mở rộng) + tìm route không nằm trong `routes/index.ts`.

---

## 5. V2 — Kiểm chứng độc lập F1–F12

Với mỗi finding, review viên **tự đọc code** rồi kết luận, không đọc cột "Bằng chứng kiểm định" của báo cáo trước khi kết luận (tránh mồi neo nhận thức).

Verdict chỉ có ba giá trị: **Xác nhận đóng** · **Đóng một phần** (có biện pháp nhưng còn đường vòng) · **Bác bỏ** (vẫn tái hiện được).

| F | Tuyên bố | Cách kiểm chứng độc lập |
|---|---|---|
| F1 | Không vượt được lộ trình học | Đọc `markComplete`; thử gọi trực tiếp `PATCH /lessons/:id/complete` cho bài 2 khi bài 1 chưa xong, bằng token student thật (V4) |
| F2 | Sửa nội dung đã duyệt phải duyệt lại | Đọc `courseMutationPolicy.ts`; kiểm cả 3 đường: sửa course, sửa lesson, sửa quiz — cả ba phải cùng chạm trạng thái course |
| F3 | Chặn cascade mất lịch sử | Đọc `onDelete` trong `schema.prisma` **và** guard ở service. Nếu chỉ có guard ở service mà schema vẫn `Cascade`, thì thao tác xóa thẳng qua Prisma Studio/SQL vẫn mất dữ liệu → **Đóng một phần** |
| F4 | Race sửa đề/nộp bài | Đọc `serializableTransaction.ts`: có retry, có giới hạn số lần retry, có phân biệt mã lỗi `40001` không |
| F5 | Không khóa được admin cuối | Đọc logic đếm admin — phải nằm **trong** transaction, không phải đếm trước rồi update sau |
| F6 | Siết role student | Kiểm **cả** route (`authorize("student")`) **và** service guard cho 4 endpoint: enroll, complete, submit, list-mine |
| F7 | Không làm lại sau khi đạt | Backend chặn (không chỉ ẩn nút UI) |
| F8 | Khóa `passScore` hồi tố | Chặn sửa sau khi có submission → trả 409 |
| F9 | Completeness khi gửi duyệt | Kiểm đủ: description, thumbnail, category, ≥1 lesson |
| F10 | Coverage frontend | Đọc `role-routing.spec.ts` — xác nhận đây là smoke với API mock, **không** đếm là E2E thật |
| F11 | Bundle nhỏ lại | Đối chiếu số build thật ở V0 gate 14 |
| F12 | Lint gate | Xác nhận `--max-warnings=0` có trong CI, không chỉ trong `package.json` |

**Thêm một việc bắt buộc:** đọc `backend/tests/graduationRegression.test.ts` (97 dòng) và trả lời — bộ test này có thật sự tái hiện kịch bản tấn công của F1–F9, hay chỉ khẳng định service trả 403 ở đường đi hạnh phúc? Một regression test không tái hiện được lỗi gốc thì không bảo vệ được gì.

---

## 6. V3 — Truy quét vùng mù

Đây là phần có giá trị cao nhất, vì nó nhắm vào chỗ mà kiến trúc test hiện tại **về nguyên tắc** không thấy được.

### 6.1. Vùng mù đã biết — Prisma giả lập trong bộ nhớ

Bộ test thay tầng Prisma bằng bản giả lập. Điều đó khiến toàn bộ nhóm lỗi sau **không thể** bị bắt bởi `npm test`:

| Nhóm | Lỗi tiềm ẩn | Cách kiểm |
|---|---|---|
| Ràng buộc CSDL | `@@unique`, `onDelete`, `NOT NULL` có thật trong SQL không | Dựng Postgres tạm, `migrate deploy`, `\d+` từng bảng |
| Isolation level | `Serializable` có thật sự được set không, hay bản giả lập luôn "thành công" | Chạy hai request đồng thời trên Postgres thật (V4) |
| N+1 query | Vòng lặp gọi Prisma trong service | Bật `log: ['query']`, đếm số query cho `/courses/:id/learn` và `/admin/stats` |
| Migration drift | §3.1 | `prisma migrate diff` |
| Kiểu dữ liệu | `Int` overflow, `text` vs `varchar`, timezone của `datetime` | Đọc schema + thử biên |

### 6.2. Danh mục soi theo trục chất lượng

**Bảo mật**

- [ ] Có endpoint nào trả `password` / `refreshToken` không — grep toàn bộ `select` của Prisma cho model `User`
- [ ] JWT: thuật toán có bị để `none`/`alg` linh hoạt không; `expiresIn` có đúng 15 phút / 7 ngày
- [ ] IDOR: mọi thao tác ghi có đối chiếu `instructorId === req.user.id` không — liệt kê **tất cả** endpoint ghi, đánh dấu endpoint nào thiếu
- [ ] Rate limit có áp cho `/auth/*` và `/ai/*` không, và có bị bỏ qua khi chạy sau proxy (`trust proxy`) không
- [ ] CORS whitelist: kiểm cấu hình có cho phép `origin: true` hay reflect origin không
- [ ] Prompt injection vào Gemini: nội dung bài học do giảng viên nhập được nhét thẳng vào prompt — đánh giá rủi ro và mức chấp nhận được cho đồ án

**Đúng đắn nghiệp vụ**

- [ ] Công thức `%` tiến độ khi khóa học có 0 bài → chia cho 0?
- [ ] Điểm trung bình khi học viên chưa nộp bài nào → `null` hay `0`? Hai thứ này khác nhau trên UI
- [ ] `attemptNo` tính thế nào khi giảng viên xóa quiz rồi tạo lại
- [ ] Đổi thứ tự bài học khi có bài đang bị khóa → trạng thái unlock có tính lại đúng không
- [ ] Múi giờ: `publishedAt`, `enrolledAt` hiển thị trên UI theo UTC hay Asia/Ho_Chi_Minh

**Chất lượng mã**

- [ ] `grep -rn "console.log" backend/src frontend/src` → phải rỗng
- [ ] `grep -rn ": any" backend/src frontend/src` → đếm và giải trình từng chỗ
- [ ] Mọi route async có `try/catch` + `next(err)` hoặc wrapper tương đương
- [ ] Controller có lọt nghiệp vụ không (nguyên tắc "controller không chứa nghiệp vụ" ở `DE-AN.md` §3.1)
- [ ] Service có import `express` không (nguyên tắc "service không biết gì về HTTP")

**Frontend**

- [ ] `axiosClient` refresh token: kiểm `refreshQueue.ts` chống gọi refresh nhiều lần đồng thời
- [ ] Có trang nào hiển thị dữ liệu nhạy cảm trước khi `AuthContext` load xong không (flash of wrong content)
- [ ] Xử lý lỗi mạng: mọi trang gọi API có trạng thái loading và error rõ ràng
- [ ] Responsive: kiểm 3 breakpoint (360px / 768px / 1280px) trên 5 trang chính

### 6.3. Tệp ưu tiên đọc kỹ (theo thứ tự)

1. `services/quizService.ts` (154 dòng test bảo vệ) — trái tim đề tài, 4/10 điểm Student nằm ở đây
2. `services/courseMutationPolicy.ts` — mới, sinh ra từ F2, chưa có vòng review nào soi
3. `utils/serializableTransaction.ts` — mới, sinh ra từ F4/F5, xử lý concurrency là chỗ dễ sai nhất
4. `services/lessonRules.ts` — luật mở khóa, gọi ở nhiều nơi
5. `services/adminService.ts` — 232 dòng test, nhiều nhánh nhất
6. `middleware/authorize.ts` + toàn bộ `routes/*.ts` — ma trận quyền
7. `services/aiService.ts` + `geminiClient.ts` — điểm demo, dễ vỡ nhất khi bảo vệ
8. `frontend/src/api/axiosClient.ts` + `refreshQueue.ts`

---

## 7. V4 — Kiểm định vận hành thật

Bốn ô chưa tick trong `BAO-CAO-KHAC-PHUC` đều nằm ở vòng này. Không làm V4 thì báo cáo vẫn còn dấu hỏi.

### 7.1. Dựng PostgreSQL dùng một lần

```bash
docker compose up -d          # Postgres cục bộ, KHÔNG đụng CSDL production
cd backend
cp .env.example .env          # trỏ DATABASE_URL vào Postgres cục bộ
npx prisma migrate deploy     # cố ý dùng deploy, không dùng migrate dev
npm run seed
```

Dùng `migrate deploy` (chứ không `migrate dev`) là có chủ đích: nó chạy đúng như Render sẽ chạy, nên nếu drift ở §3.1 tồn tại, nó sẽ nổ ra **ở đây**, trên máy, chứ không phải trên production.

### 7.2. Ba kịch bản E2E thật (không mock)

**Kịch bản 1 — Học viên (bao phủ S1–S9)**
Đăng ký tài khoản mới → đăng nhập → lọc khóa theo category + level → xem chi tiết → enroll → học bài 1 → đánh dấu hoàn thành → kiểm % tiến độ → làm quiz, cố tình sai 1 câu → nộp → xem đúng/sai → bấm "Vì sao sai?" (Gemini live) → làm lại → đạt → xác nhận nút làm lại biến mất.

**Kịch bản 2 — Giảng viên (bao phủ I1–I5)**
Tạo khóa thiếu mô tả → thử gửi duyệt → **phải bị chặn** (F9) → điền đủ → thêm 3 bài học → đổi thứ tự bài 1↔3 → tạo quiz bằng Gemini → sửa 1 câu → lưu → gửi duyệt → sau khi admin duyệt, sửa nội dung → **phải quay về draft** (F2) → thử xóa bài đã có học viên học → **phải bị chặn 409** (F3) → xem thống kê lớp.

**Kịch bản 3 — Quản trị (bao phủ A1–A4)**
Xem hàng đợi duyệt → từ chối với lý do < 10 ký tự → **phải bị chặn** → từ chối đúng cách → duyệt khóa khác → CRUD category → thử xóa category còn khóa học → **phải 409** → khóa tài khoản học viên → xác nhận học viên đó không login được → thử tự khóa chính mình → **phải bị chặn** → xem dashboard.

### 7.3. Kịch bản tấn công (chạy bằng Postman/curl, không qua UI)

Đây là phần chứng minh "bảo mật ở backend, không phải ẩn bằng CSS":

| # | Tấn công | Kết quả bắt buộc |
|---|---|---|
| T1 | `GET /lessons/:id/quiz` — grep chuỗi `isCorrect` trong response | Không xuất hiện |
| T2 | `POST /quiz/:id/submit` kèm `score: 100` | Server chấm ra điểm thật |
| T3 | `PATCH /lessons/:id/complete` cho bài đang khóa | 403, không tạo `LessonProgress` |
| T4 | Token instructor gọi `POST /courses/:id/enroll` | 403 (F6) |
| T5 | Instructor A gọi `PATCH /courses/:id` của instructor B | 403 |
| T6 | Instructor tự gọi `PATCH /courses/:id/publish` | 403 |
| T7 | `GET /users` — grep `password`, `refreshToken` | Không xuất hiện |
| T8 | `POST /auth/register` kèm `role: "admin"` | Bị `stripUnknown`/reject, tài khoản tạo ra là student |
| T9 | Hai request `POST /courses/:id/enroll` đồng thời | Đúng 1 bản ghi, request kia 409 |
| T10 | Hai admin khóa nhau đồng thời | Còn ≥1 admin hoạt động (F5) |
| T11 | Sửa `passScore` sau khi có submission | 409 (F8) |
| T12 | Access token đã hết hạn / bị sửa chữ ký | 401 |

### 7.4. Gemini live

- Gọi thật **một** lần cho mỗi trong 3 tính năng (generate-quiz, explain-answer, summarize), bằng API key thật.
- Xác nhận: lần gọi thứ hai cho cùng câu trả lời sai **không** gọi lại Gemini (đọc từ `Answer.aiExplanation`).
- Xác nhận: gỡ `GEMINI_API_KEY` → hệ thống vẫn chạy, nút AI bị làm mờ, **không sập** (suy giảm êm).
- Kiểm `gemini-3.6-flash` còn được Google hỗ trợ tại ngày bảo vệ — model cũ đã bị ngừng một lần rồi (commit `9d1dca1`).

### 7.5. Smoke production (không ghi dữ liệu)

- `/health` trả `{"status":"ok","db":"up"}`
- Danh sách khóa public trả envelope đúng
- CORS: origin Vercel được cấp header, origin lạ không
- ⚠️ **Cảnh báo lịch:** CSDL Render Free được ghi nhận hết hạn **~27/09/2026** (commit `8a76345`). Phải xác nhận ngày bảo vệ nằm trước mốc này, hoặc lên phương án gia hạn/di chuyển.
- 🚫 **Tuyệt đối không** chạy `seed:prod` trên CSDL production.

---

## 8. V5 — Chốt hồ sơ bảo vệ

| # | Hạng mục | Việc cần làm | Trạng thái hiện biết |
|---|---|---|---|
| 1 | Mã học viên | Điền vào **2 vị trí** trang đầu DOCX | ❌ còn placeholder |
| 2 | Tên học viên / GVHD | Xác nhận đã điền đúng | Đã điền ở `cbab148`, cần soát lại |
| 3 | Số phép test | Đồng nhất **344** ở: DOCX, PPTX, `DE-AN.md`, `README.md` | ⚠️ `DE-AN.md` (đọc ngày 02/09) vẫn ghi **318** ở §1, §9, §9bis → **phải sửa** |
| 4 | Số model Prisma | `DE-AN.md` ghi 11 model — đối chiếu `schema.prisma` thật | Cần kiểm |
| 5 | Cổng PostgreSQL | 5433 cục bộ / 18 trên Render — đồng nhất mọi tài liệu | Đã sửa ở `9d1dca1`, soát lại |
| 6 | DOCX/PPTX validate | `officecli validate` → 0 lỗi OpenXML | Đã đạt ở mốc trước, chạy lại sau khi sửa (3) |
| 7 | Slide 17 trang | Render kiểm tràn chữ/chồng đối tượng | Đã kiểm, soát lại nếu sửa số liệu |
| 8 | Kịch bản demo 8 phút | Diễn tập bấm giờ ít nhất 2 lần | Chưa làm |
| 9 | Phương án dự phòng demo | Ảnh chụp/video kết quả AI phòng khi Gemini lỗi; ping `/health` trước 30 phút chống ngủ đông Render | Chưa chuẩn bị |
| 10 | Câu hỏi hội đồng | Chuẩn bị trả lời 10 câu dễ bị hỏi (xem §8.1) | Chưa làm |

### 8.1. Mười câu hội đồng nhiều khả năng hỏi — cần soạn sẵn câu trả lời

1. Vì sao dùng máy trạng thái 4 bước cho `Course.status` mà không dùng cờ boolean?
2. Chấm điểm ở server thì chứng minh thế nào là frontend không tự chấm được?
3. Nếu giảng viên sửa đáp án đúng sau khi học viên đã nộp thì điểm cũ ra sao?
4. Vì sao không lưu sẵn cột `progressPercent`?
5. Transaction Serializable dùng ở đâu và vì sao cần nó?
6. API key Gemini đặt ở đâu, vì sao không đặt ở frontend?
7. Test dùng Prisma giả lập — vậy làm sao biết ràng buộc CSDL đúng?
8. Refresh token lưu trong CSDL để làm gì, khác gì lưu ở client?
9. Vì sao chọn Yup mà không phải Zod/class-validator?
10. Nếu có thêm 2 tuần, sẽ làm gì tiếp?

---

## 9. Cách phân loại và xử lý finding

| Mức | Định nghĩa | Xử lý |
|---|---|---|
| **P0** | Rò rỉ bí mật, mất dữ liệu production, không chạy được | Dừng mọi việc, sửa ngay |
| **P1** | Sai nghiệp vụ cốt lõi thuộc thang điểm, hoặc vượt được phân quyền | Bắt buộc sửa trước bảo vệ |
| **P2** | Sai lệch tài liệu/hồ sơ, lỗi biên, thiếu test cho nhánh quan trọng | Sửa nếu còn thời gian; nếu không, khai báo minh bạch khi bảo vệ |
| **P3** | Chất lượng mã, tối ưu, khuyến nghị kiến trúc | Ghi vào mục "hướng phát triển" của báo cáo |

Mỗi finding ghi theo mẫu cố định:

```
[ID] [Mức] Tiêu đề một dòng
Vị trí:      tệp:dòng
Tái hiện:    lệnh/thao tác cụ thể
Hiện tượng:  quan sát được
Kỳ vọng:     theo yêu cầu nào của đề tài
Đề xuất sửa: hướng cụ thể, không chung chung
```

---

## 10. Tiêu chí kết luận "đủ điều kiện tốt nghiệp"

Kết luận **Đạt** chỉ được đưa ra khi **đồng thời** thỏa cả năm:

1. **Chức năng:** 18/18 yêu cầu (S1–S9, I1–I5, A1–A4) có code + test được chỉ đích danh.
2. **Kỹ thuật bắt buộc:** Node/Express + React + PostgreSQL + Prisma + JWT + Docker + CI + cloud deploy + Gemini — đủ, đang chạy được.
3. **Chất lượng:** 17/17 gate V0 xanh, không còn P0/P1 mở.
4. **Vận hành:** 3 kịch bản E2E thật đạt + 12/12 kịch bản tấn công cho kết quả đúng + Gemini live đạt.
5. **Hồ sơ:** 10/10 mục V5 xong, không còn placeholder, số liệu đồng nhất giữa code và tài liệu.

Nếu (1)(2) đạt mà (3)(4)(5) còn thiếu → kết luận **"Đủ để bảo vệ, chưa đủ để tuyên bố production-ready"**, và phải liệt kê rõ cái gì còn thiếu — đây chính là kết luận của vòng review trước, không được lặp lại lần nữa mà không nêu lý do.

---

## 11. Sản phẩm bàn giao của vòng review này

| Tệp | Nội dung |
|---|---|
| `docs/REVIEW-TOT-NGHIEP-2026-09-XX.md` | Báo cáo review đầy đủ: ma trận 18 yêu cầu, verdict F1–F12, finding mới, kết luận theo §10 |
| `docs/NHAT-KY-E2E-2026-09-XX.md` | Nhật ký 3 kịch bản + 12 kịch bản tấn công, kèm ảnh chụp |
| `docs/logs/` | Output thô của 17 gate (để đối chứng, không tin trí nhớ) |
| Cập nhật `DE-AN.md` | Sửa 318 → 344 và các số liệu lệch khác |
| Cập nhật DOCX/PPTX | Mã học viên + số liệu đồng nhất |

---

## 12. Rủi ro của chính kế hoạch này

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| WSL trên máy lỗi mount VHDX (đã ghi nhận ở review trước) | Không chạy được browser automation → V4 phải làm tay | Chấp nhận làm tay, bù bằng ảnh chụp; hoặc chạy Playwright headless trực tiếp trên Windows |
| Không có API key Gemini còn quota | §7.4 không chạy được | Xin key tạm; nếu không, khai báo rõ trong báo cáo là chưa kiểm live |
| Phát hiện drift migration ở §3.1 | Phải sửa schema + redeploy → phát sinh 2–4 giờ | Đưa §3.1 lên **đầu tiên** trong V0, để biết sớm |
| CSDL Render Free hết hạn ~27/09/2026 | Mất dữ liệu demo | Xác nhận ngày bảo vệ; backup trước |
| Sửa lỗi trong lúc review làm lệch baseline | Số liệu không đối chứng được | Review xong toàn bộ rồi mới sửa; mọi sửa chữa đi commit riêng |

---

*Kế hoạch lập ngày 02/09/2026 tại mốc `b5b18dc`. Chưa có bước nào được thực hiện.*
