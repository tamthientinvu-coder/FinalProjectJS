# Chuẩn bị bảo vệ đồ án LearnQuiz

> Cập nhật 06/09/2026 · Đối chiếu với mã nguồn tại `83dbadd`
> Mọi con số trong tài liệu này đã được đo lại từ mã nguồn và từ lần chạy thật ngày 06/09, không chép lại từ báo cáo.

Tài liệu này gồm ba phần: **kiến thức phải nói trôi chảy**, **bộ câu hỏi hội đồng thường hỏi kèm câu trả lời**, và **những điểm yếu nên tự nhận trước khi bị hỏi**. Phần cuối là số liệu cần thuộc và việc phải làm trong ngày bảo vệ.

Nguyên tắc xuyên suốt: **nói đúng điều mình đã làm, và nói rõ điều mình chưa làm cùng lý do.** Một đồ án thừa nhận giới hạn có căn cứ luôn được đánh giá cao hơn một đồ án tô hồng.

---

## Phần A — Tám khối kiến thức cốt lõi

### A1. Kiến trúc tổng thể

Ba tầng tách bạch, mỗi tầng một trách nhiệm:

```
Trình duyệt
   │  HTTPS + JWT ở header Authorization
   ▼
Frontend  React 19 · Vite · MUI · React Router 7        (Vercel)
   │  REST /api/v1, axios interceptor tự làm mới token
   ▼
Backend   Express 4 · TypeScript                        (Render)
   │  route → validate → authenticate → authorize → controller → service
   ▼
Prisma ORM  →  PostgreSQL 16                            (Render)
```

**Điểm cần nhấn:** controller **không** chứa luật nghiệp vụ. Controller chỉ đọc request, gọi service, trả response. Toàn bộ luật nằm ở tầng service — nhờ vậy kiểm thử được luật mà không cần dựng HTTP hay cơ sở dữ liệu.

Backend chia 8 thư mục: `config` · `controllers` (9 tệp) · `middleware` (8) · `routes` (11) · `schemas` (7) · `services` (14) · `types` · `utils` (5). Tổng **46 endpoint**.

### A2. Xác thực và phân quyền

**Hai token, hai khoá bí mật riêng biệt:**

| | Access token | Refresh token |
|---|---|---|
| Hạn | 15 phút | 7 ngày |
| Khoá ký | `JWT_ACCESS_SECRET` | `JWT_REFRESH_SECRET` |
| Nơi lưu ở client | `localStorage` | `localStorage` |
| Nơi lưu ở server | không lưu (stateless) | **có lưu**, cột `users.refresh_token` |

**Vì sao dùng hai khoá khác nhau:** nếu chung một khoá, kẻ tấn công có access token 15 phút có thể đem chính chuỗi đó gọi `/auth/refresh` để đổi lấy phiên 7 ngày. Tách khoá thì access token bị lộ vẫn chỉ sống được 15 phút.

**Xoay vòng refresh token.** Mỗi lần gọi `/auth/refresh`, server phát refresh token mới và **ghi đè** vào cột `users.refresh_token`. Server đối chiếu token gửi lên với bản đang lưu; không khớp thì từ chối. Nhờ đó `logout` (đặt cột về `null`) thật sự vô hiệu hóa được phiên.

**Mật khẩu:** `bcryptjs`, `cost = 10`. Không bao giờ lưu mật khẩu thô, không bao giờ trả `password` hay `refreshToken` trong bất kỳ response nào.

**Phân quyền** bằng middleware `authorize(...roles)`, luôn đặt **sau** `authenticate`. Ba vai: `student` · `instructor` · `admin`.

### A3. Mô hình dữ liệu

**11 bảng:** `User` · `Category` · `Course` · `Lesson` · `Quiz` · `Question` · `Choice` · `Enrollment` · `LessonProgress` · `QuizSubmission` · `Answer`.

Ba loại ràng buộc đáng nói:

| Ràng buộc | Ý nghĩa nghiệp vụ |
|---|---|
| `@@unique([studentId, courseId])` trên `Enrollment` | một học viên không ghi danh hai lần cùng một khóa |
| `@@unique([courseId, order])` trên `Lesson` | thứ tự bài học trong khóa là duy nhất |
| `@@unique([studentId, quizId, attemptNo])` trên `QuizSubmission` | mỗi lần làm bài là một lượt riêng, không đè lên nhau |
| `lessonId Int @unique` trên `Quiz` | quan hệ **1–1**: mỗi bài học tối đa một quiz |

**`onDelete: Cascade`** dùng cho quan hệ sở hữu (xóa khóa học thì xóa bài học, quiz, câu hỏi…). **`onDelete: SetNull`** dùng khi mất tham chiếu vẫn giữ được bản ghi (`Course.categoryId`, `Answer.choiceId`).

Đây là chỗ hội đồng hay hỏi sâu — xem Phần B, câu B7 và B8.

### A4. Luật nghiệp vụ tách thành hàm thuần

Ba tệp không đụng cơ sở dữ liệu, không đụng HTTP, cùng đầu vào cho cùng đầu ra:

- **`quizGrader.ts`** — chấm điểm. Luôn duyệt theo **danh sách câu hỏi thật trong đề**, không duyệt theo bài nộp: học viên bỏ 3 câu không được biến đề 5 câu thành đề 2 câu. Đáp án gửi lên phải thuộc đúng câu hỏi đó, nếu không thì coi như bỏ trống.
- **`courseWorkflow.ts`** — máy trạng thái vòng đời khóa học:

  ```
  draft ──submit──▶ pending ──publish──▶ published
    ▲                  │                     │
    │                  └──reject──▶ rejected │
    └──────────── unpublish ─────────────────┘
                       rejected ──submit──▶ pending
  ```

- **`lessonRules.ts`** — luật về bài học.

**Vì sao tách:** kiểm thử được đầy đủ mọi tổ hợp mà không cần dựng cơ sở dữ liệu, và thêm một trạng thái mới chỉ phải sửa **một bảng** thay vì rải `if/else` khắp nơi.

### A5. Bảy lớp bảo vệ ở backend

| Lớp | Cài đặt | Chống điều gì |
|---|---|---|
| `helmet()` | mặc định | các header nguy hiểm, clickjacking, sniffing |
| `cors()` | danh sách trắng: `FE_URL` + hai địa chỉ `localhost` cho lúc phát triển | trang lạ gọi API bằng phiên của người dùng |
| `express.json({ limit: "1mb" })` | giới hạn thân request | tấn công làm cạn bộ nhớ |
| `globalLimiter` | 300 req / phút | lạm dụng chung |
| `authLimiter` | 20 req / 15 phút trên `/auth/*` | dò mật khẩu |
| `aiLimiter` | 10 req / phút trên `/ai/*` | đốt tiền Gemini |
| `validate(schema)` | Yup, chạy **trước** controller | dữ liệu bẩn lọt vào tầng nghiệp vụ |

Thêm hai điểm:

- **`app.set("trust proxy", 1)`** — bắt buộc khi chạy sau proxy của Render. Không có dòng này thì `express-rate-limit` thấy mọi request đến từ **một** IP của proxy, và giới hạn tốc độ trở nên vô nghĩa (hoặc chặn nhầm toàn bộ người dùng).
- **`errorHandler`** đặt **cuối cùng** trong `app.ts`. Lỗi ngoài dự kiến được ghi log đầy đủ ở server nhưng chỉ trả về `"Lỗi hệ thống nội bộ"` — **không lộ stack trace ra ngoài**. Mã lỗi Prisma được dịch sang HTTP đúng nghĩa: `P2002` → 409, `P2025` → 404, `P2003` → 409.

### A6. Kiểm thử

| Tầng | Số liệu (đo ngày 06/09) | Công cụ |
|---|---|---|
| Backend unit + integration | **345 phép khẳng định** | Vitest |
| Frontend unit | **4 tệp / 13 test** | Vitest |
| End-to-end | **6 kịch bản** | Playwright |
| Tổng tệp test | **15** | |

**Chiến lược:** luật nghiệp vụ thuần được phủ dày nhất (chấm điểm, chuyển trạng thái), vì đó là chỗ sai sẽ gây hậu quả thật mà lại rẻ nhất để kiểm thử. E2E chỉ phủ những đường người dùng đi nhiều nhất — E2E đắt và giòn, không nên dùng để phủ luật.

### A7. Triển khai

- **Backend** trên Render, dựng bằng **Blueprint** (`render.yaml`) — không bấm tay từng bước.
- **`prisma migrate deploy` đặt ở `buildCommand`**, không ở `startCommand`: di trú chạy **một lần mỗi lần deploy**, thay vì chạy lại mỗi khi container khởi động lại.
- **`healthCheckPath: /health`** để Render biết dịch vụ đã sẵn sàng.
- **`JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` dùng `generateValue: true`** — Render tự sinh chuỗi ngẫu nhiên, bí mật **không nằm trong git**.
- **Frontend** trên Vercel. **Cơ sở dữ liệu** PostgreSQL trên Render, cùng vùng `singapore` với API để giảm độ trễ.

**CI (GitHub Actions), 3 job:** Backend (typecheck → lint → test → build) · Frontend (typecheck → lint → test → E2E → build) · Bảo mật (rà lịch sử `.env` + `npm audit --audit-level=high`). Thêm hai workflow: `production-smoke` và `uptime-ping`.

### A8. Tích hợp AI

Gemini dùng cho ba việc: **sinh câu hỏi trắc nghiệm** từ nội dung bài học, **giải thích câu sai**, **tóm tắt bài học**.

Ba biện pháp phòng thủ — đây là phần hội đồng thích hỏi:

1. **Cắt bớt nội dung** trước khi đưa vào prompt, để không vượt hạn mức token.
2. **Ràng buộc JSON schema** trong lời gọi, rồi **vẫn** kiểm tra lại đầu ra bằng Yup (`aiQuestionsSchema`). Mô hình ngôn ngữ có thể trả về JSON hợp lệ nhưng **sai nghiệp vụ** — ví dụ 4 đáp án mà không đáp án nào đúng. Log `Gemini output failed quiz validation` trong bộ test chính là bằng chứng lớp kiểm tra này hoạt động.
3. **`aiLimiter` 10 req/phút** vì Gemini tính tiền theo request.

**Câu trả lời chuẩn nếu bị hỏi "AI sai thì sao":** đầu ra của AI được coi là **dữ liệu chưa tin cậy**, phải qua kiểm tra như mọi dữ liệu từ ngoài vào; và câu hỏi sinh ra là **bản nháp cho giảng viên duyệt**, không tự động đăng cho học viên.

---

## Phần B — Bộ câu hỏi hội đồng và cách trả lời

### Nhóm 1 — Kiến trúc và công nghệ

**B1. Vì sao chọn TypeScript thay vì JavaScript thuần?**
Vì lỗi kiểu được bắt lúc biên dịch thay vì lúc chạy trên máy người dùng. Cụ thể trong đồ án này: hợp đồng API được khai báo một lần ở `types/api.ts` và dùng chung cho controller lẫn service, nên đổi hình dạng một response là trình biên dịch chỉ ra ngay mọi chỗ hỏng. `npm run typecheck` là một cổng bắt buộc trong CI.

**B2. Vì sao dùng Prisma mà không viết SQL trực tiếp?**
Ba lý do: lược đồ và di trú được quản lý bằng phiên bản (`prisma migrate`), truy vấn có kiểu tự động suy ra, và tham số luôn được tách khỏi câu lệnh nên **không có đường cho SQL injection**. Đổi lại, những truy vấn phức tạp phải hiểu Prisma sinh ra SQL gì — đó là lý do em dùng `groupBy` thay vì vòng lặp ở `statsService`.

**B3. REST hay GraphQL? Vì sao?**
REST. Quy mô đồ án có tập endpoint ổn định và biết trước, không có nhu cầu client tự chọn trường. GraphQL sẽ thêm một tầng schema và bài toán N+1 mới mà không giải quyết vấn đề nào đang có.

**B4. Nếu phải làm lại, em sẽ đổi gì?**
Trả lời trung thực, đừng nói "không đổi gì". Ba điều đáng nói: đưa refresh token vào cookie `httpOnly` thay vì `localStorage`; cho phép một tài khoản đăng nhập nhiều thiết bị (hiện tại chỉ một); và thêm chỉ mục cho các khóa ngoại nóng khi dữ liệu vượt quy mô trình diễn.

### Nhóm 2 — Bảo mật

**B5. Token lưu ở `localStorage` — có an toàn không?**
**Không tuyệt đối, và em biết rõ đánh đổi này.** `localStorage` đọc được bằng JavaScript, nên nếu có lỗ hổng XSS thì token bị lấy. Phương án an toàn hơn là refresh token đặt trong cookie `httpOnly` + `SameSite=Strict`, khi đó JavaScript không đọc được. Em chọn `localStorage` vì frontend và backend nằm **khác tên miền** (Vercel và Render), cookie cross-site cần cấu hình `SameSite=None; Secure` và thêm phòng thủ CSRF — phức tạp hơn phạm vi đồ án. Đây là hạng mục cải tiến đã ghi trong báo cáo, không phải chỗ bị bỏ sót.

**B6. Đăng xuất rồi thì access token cũ còn dùng được không?**
**Còn, cho tới khi hết 15 phút.** Access token là stateless, không tra cơ sở dữ liệu nên không thu hồi ngay được. Cái bị thu hồi tức thì là **refresh token** — cột `users.refresh_token` được đặt về `null`, nên không thể gia hạn phiên. Muốn thu hồi access token ngay thì phải có danh sách đen (blacklist) trong Redis, đổi lại mất tính stateless và thêm một hạ tầng. Với hạn 15 phút, em đánh giá rủi ro chấp nhận được.

> Đừng nói "mọi token bị vô hiệu ngay" — điều đó không đúng và hội đồng có thể kiểm chứng.

**B6b. Danh sách trắng CORS có gì đáng nói?**
Danh sách gồm `FE_URL` (trang Vercel thật) và hai địa chỉ `localhost` dùng lúc phát triển. Hai địa chỉ `localhost` **vẫn còn** khi chạy trên môi trường thật. Rủi ro thực tế rất thấp — kẻ tấn công phải điều khiển được một trang đang chạy trên chính máy nạn nhân — nhưng đúng ra nên lọc theo `NODE_ENV` để môi trường thật chỉ còn một origin. Đây là chỗ em biết và chủ ý chưa sửa sát ngày bảo vệ, vì mọi thay đổi mã nguồn lúc này đều làm lệch số liệu đã chốt trong báo cáo.

**B7. Chống SQL injection thế nào?**
Prisma luôn tách tham số khỏi câu lệnh, và trong dự án **không có** truy vấn chuỗi thô (`$queryRawUnsafe`). Thêm một lớp nữa: mọi tham số `:id` đi qua middleware `validateId`, và mọi thân request đi qua `validate(schema)` bằng Yup **trước khi** vào controller.

**B8. Chống brute-force mật khẩu?**
`authLimiter`: 20 lần trong 15 phút cho toàn bộ `/auth/*`. Kèm điều kiện tiên quyết là `app.set("trust proxy", 1)` — không có dòng này, sau proxy Render mọi request trông như đến từ cùng một IP và giới hạn tốc độ vô nghĩa.

### Nhóm 3 — Cơ sở dữ liệu

**B9. Vì sao `Quiz.lessonId` là `@unique` mà không phải khóa ngoại thường?**
Vì đó là quan hệ **1–1**: mỗi bài học tối đa một quiz. `@unique` trên cột khóa ngoại chính là cách biểu diễn 1–1 ở tầng cơ sở dữ liệu — nó chặn ở tầng thấp nhất, không phụ thuộc vào việc tầng ứng dụng có nhớ kiểm tra hay không.

**B10. Vì sao có `@@index([status])` mà không có `@@index([instructorId])`?**
Đây là câu hỏi hay và em có phân tích riêng trong đề án, mục 4.3. **PostgreSQL không tự tạo chỉ mục cho cột khóa ngoại phía con** — khác MySQL/InnoDB. Rà cả 15 cột khóa ngoại thì 8 cột đã được phủ (nhờ `@@unique` tổ hợp phủ **cột dẫn đầu**, hoặc `@unique` một cột), còn **7 cột chưa được phủ**.

Về nghịch lý `status` / `instructorId`: xét độ chọn lọc thì `instructorId` tốt hơn hẳn (`status` chỉ có 4 giá trị, một truy vấn trả về 25–100% số dòng). `status` được giữ vì nó phục vụ đúng **một truy vấn nóng** — danh sách khóa học công khai luôn cố định `status = published`.

**Vì sao chưa thêm 7 chỉ mục kia:** PostgreSQL đọc theo trang 8 KB; bảng chưa vượt một hai trang thì **luôn** quét tuần tự, có chỉ mục cũng không dùng tới. Ở quy mô hiện tại lợi ích đo được bằng không, trong khi mỗi chỉ mục tốn thêm ~20–25 byte mỗi dòng và làm chậm ghi. **Thêm chỉ mục mà không có `EXPLAIN ANALYZE` chứng minh là tối ưu theo cảm tính.**

**B11. Xử lý N+1 query ở đâu?**
Ở `statsService`. Thống kê lớp học ban đầu chạy một truy vấn cho mỗi quiz và mỗi học viên. Đã thay bằng **bốn truy vấn `groupBy` chạy song song** — số truy vấn **không tăng** theo số quiz hay số học viên. Đây là lỗi thật đã phát hiện và sửa, có ghi trong nhật ký dự án.

**B12. Xóa một khóa học thì dữ liệu liên quan ra sao?**
`onDelete: Cascade` theo chuỗi sở hữu: khóa học → bài học → quiz → câu hỏi → đáp án; và khóa học → ghi danh → tiến độ. Còn `Answer.choiceId` dùng `SetNull` — xóa một đáp án không được làm mất bản ghi bài làm của học viên, chỉ mất tham chiếu tới lựa chọn đó.

### Nhóm 4 — Kiểm thử và chất lượng

**B13. Em kiểm thử những gì, và vì sao chọn như vậy?**
345 phép khẳng định ở backend, 13 test frontend, 6 kịch bản E2E. Phủ dày nhất là **luật nghiệp vụ thuần** — chấm điểm và chuyển trạng thái khóa học — vì đó là chỗ sai gây hậu quả thật mà lại rẻ nhất để kiểm thử. E2E chỉ phủ đường người dùng đi nhiều nhất, vì E2E chậm và giòn.

**B14. Có lỗi nào tìm ra nhờ kiểm thử không?**
Có, và nên kể một ca cụ thể: kịch bản E2E *"Back khôi phục từ khóa"* đỏ dai dẳng. Nguyên nhân **không** phải test giòn mà là **lỗi thật của giao diện**: một `useEffect` đồng bộ ô tìm kiếm theo URL đã **ghi đè chữ người dùng đang gõ** khi hai lần điều hướng nối nhau. Đã sửa gốc bằng cách bỏ effect đó, chỉ đồng bộ khi có sự kiện `popstate`, và đọc giá trị từ DOM ngay lúc nhấn phím thay vì từ closure. Sau khi sửa: 6/6 xanh.

**B15. CI chạy những gì?**
Ba job song song: Backend (typecheck → lint → test → build), Frontend (typecheck → lint → test → Playwright → build), Bảo mật (rà lịch sử `.env` + `npm audit --audit-level=high`). Không job nào xanh thì không merge.

### Nhóm 5 — Triển khai và vận hành

**B16. Vì sao `migrate deploy` nằm ở `buildCommand` chứ không phải `startCommand`?**
Vì di trú chỉ cần chạy **một lần cho mỗi lần deploy**. Đặt ở `startCommand` thì mỗi lần container khởi động lại — Render free tier ngủ sau 15 phút không có request — di trú lại chạy một lần nữa, vừa chậm khởi động vừa rủi ro nếu có nhiều bản chạy song song.

**B17. Bí mật được bảo vệ thế nào?**
`.env` nằm trong `.gitignore` và CI có bước kiểm tra lịch sử git chưa từng chứa `.env`. Trên Render, hai khoá JWT dùng `generateValue: true` — Render tự sinh, **em cũng không biết giá trị**, và chúng không nằm trong git. `DATABASE_URL` lấy từ chính dịch vụ cơ sở dữ liệu qua `fromDatabase`.

**B18. Hệ thống chịu tải được bao nhiêu?**
Trả lời trung thực: **em chưa đo tải**, nên không có con số. Điều em biết chắc là các giới hạn của gói miễn phí: Render ngủ sau 15 phút không hoạt động và lần thức đầu mất khoảng 50 giây. Đó là lý do có workflow `uptime-ping`. Muốn nói về khả năng chịu tải thì phải chạy k6 hoặc Artillery và đưa số ra — chưa làm thì không nên đoán.

---

## Phần C — Bảy điểm yếu nên tự nhận trước khi bị hỏi

Chủ động nêu những điều này ở cuối phần trình bày sẽ mạnh hơn nhiều so với bị hỏi rồi mới nhận.

| # | Điểm yếu | Cách nói |
|---|---|---|
| 1 | Token trong `localStorage` | Có rủi ro XSS; phương án đúng là cookie `httpOnly`; chưa làm vì FE/BE khác tên miền, cần thêm phòng thủ CSRF |
| 2 | **Một tài khoản chỉ đăng nhập được một thiết bị** | Cột `users.refresh_token` chỉ có **một ô**; đăng nhập máy thứ hai làm mất phiên máy thứ nhất. Muốn nhiều thiết bị phải tách bảng `refresh_tokens` riêng |
| 3 | Access token không thu hồi được ngay | Stateless; cần blacklist Redis mới thu hồi tức thì; hạn 15 phút là biện pháp giảm nhẹ |
| 4 | 7 khóa ngoại chưa có chỉ mục | Có phân tích đầy đủ ở đề án 4.3; hoãn có chủ đích, chờ số đo `EXPLAIN ANALYZE` |
| 5 | Chưa đo tải | Không có số thì không nói; đã nêu rõ giới hạn gói miễn phí |
| 6 | Danh sách trắng CORS còn hai địa chỉ `localhost` ở môi trường thật | Rủi ro thấp; đúng ra nên lọc theo `NODE_ENV`; hoãn vì đóng băng mã nguồn |
| 7 | Phụ thuộc còn cách bản mới nhất vài phiên bản chính | Đã **đóng băng có chủ đích** trước bảo vệ: nâng Express 4→5 hay Prisma 5→7 là thay đổi phá vỡ, không nên làm sát ngày bảo vệ |

---

## Phần D — Số liệu phải thuộc

Đo lại ngày 06/09/2026, tất cả cổng đều **xanh**:

| Hạng mục | Số |
|---|---|
| Tệp mã nguồn và cấu hình | **162** |
| Endpoint API | **46** |
| Bảng cơ sở dữ liệu | **11** |
| Service ở backend | **14** |
| Middleware | **8** |
| Phép khẳng định backend | **345** |
| Test frontend | **13** (4 tệp) |
| Kịch bản E2E | **6** |
| Tệp test | **15** |
| Số trang báo cáo (bản PDF) | **72** |
| Lỗ hổng `npm audit` | **0** ở cả backend lẫn frontend |
| Gói JS lớn nhất sau build | 323,96 kB (nén gzip **102,85 kB**) |
| Thời gian build frontend | ~0,44 giây |

> Ba cảnh báo `moderate` qua chuỗi `express → body-parser → qs` từng ghi trong nhật ký **nay đã hết** — bản Express hiện dùng đã vá. Con số đúng để nói trước hội đồng là **0 lỗ hổng**.

---

## Phần E — Ngày bảo vệ

**Trước 30 phút**

- [ ] Gọi `https://learnquiz-api.onrender.com/health` để đánh thức Render (lần thức đầu ~50 giây)
- [ ] Mở sẵn trang `final-project-js-ten.vercel.app`, đăng nhập sẵn **ba tài khoản** ba vai ở ba cửa sổ trình duyệt riêng
- [ ] Mở sẵn tab GitHub Actions cho thấy CI xanh
- [ ] Chuẩn bị **dữ liệu thật**: một khóa học có bài học và quiz đã đăng, một tài khoản học viên đã ghi danh

**Trong lúc trình bày**

- [ ] Không chụp, không dán token đầy đủ lên màn hình
- [ ] Không thao tác ghi trên cơ sở dữ liệu thật (không chạy `seed:prod`)
- [ ] Khi demo lỗi, dùng tài khoản thử, không dùng dữ liệu đã chuẩn bị cho phần chính

**Ràng buộc thời gian**

- [ ] Xác nhận ngày bảo vệ trước **27/09/2026** — hạn của cơ sở dữ liệu Render gói miễn phí

---

## Ba câu trả lời cần thuộc nguyên văn

Đây là ba chỗ dễ trả lời sai nhất, và sai thì mất điểm nặng nhất:

1. **"Đăng xuất có vô hiệu hóa mọi token không?"** → *Refresh token bị thu hồi ngay; access token cũ còn sống tới hết 15 phút. Muốn thu hồi tức thì phải có blacklist.*

2. **"Vì sao không đánh chỉ mục hết các khóa ngoại?"** → *PostgreSQL không tự tạo chỉ mục cho khóa ngoại. Đã rà đủ 15 cột, 8 phủ 7 chưa. Bảng nhỏ hơn một hai trang 8 KB thì luôn quét tuần tự — thêm chỉ mục không có `EXPLAIN ANALYZE` là tối ưu theo cảm tính.*

3. **"AI sinh câu hỏi sai thì sao?"** → *Đầu ra của AI được coi là dữ liệu chưa tin cậy: ràng buộc JSON schema, rồi vẫn kiểm tra lại bằng Yup. Câu hỏi sinh ra là bản nháp cho giảng viên duyệt, không tự động đăng cho học viên.*
