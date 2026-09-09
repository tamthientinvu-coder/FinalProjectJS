# Nhật ký thực hiện đồ án — LearnQuiz

**Học viên:** Vũ Tâm Thiện Tín
**Lớp:** Lập trình Full-stack JavaScript — Khóa 312, Trung Tâm Tin Học, ĐH KHTN TP.HCM
**Đề tài:** số 4 — Nền Tảng Học Tập & Quiz Trực Tuyến
**Thời gian thực hiện:** 22/08/2026 → 09/09/2026 · **50 commit** trên `main`

---

## 1. Mục đích của tài liệu này

Đây là nhật ký **quá trình làm**, không phải tài liệu mô tả sản phẩm. Tài liệu mô tả sản phẩm là [`DE-AN.md`](DE-AN.md); kịch bản kiểm thử là [`HUONG-DAN-KIEM-TRA-TAY.md`](HUONG-DAN-KIEM-TRA-TAY.md); cách triển khai là [`DEPLOY.md`](DEPLOY.md).

Tài liệu này ghi lại **tôi đã tìm hiểu gì, thử gì, sai ở đâu và sửa thế nào** — kể cả những chỗ tôi hiểu sai lúc đầu. Tôi giữ lại các lỗi đã vấp vì phần lớn thời gian của đồ án nằm ở đó, và vì một hệ thống chạy được nhưng không hiểu vì sao chạy được thì không đạt mục tiêu học tập của môn.

---

## 2. Cách tôi làm việc: bốn bước lặp lại

Mỗi tính năng, mỗi lần sửa lỗi tôi đều đi qua bốn bước:

1. **Nghiên cứu** — đọc tài liệu chính thức (Prisma, Express, React Router, MUI, JWT, Docker), đọc lại bài giảng của khóa, tra cứu thêm khi gặp khái niệm mới.
2. **Thử trên localhost** — dựng lại đúng luồng, chạy `npm run dev` cả hai phía, gọi API bằng **Postman**, quan sát trình duyệt bằng **F12 (Chrome DevTools)**.
3. **Đo và đối chiếu** — không tin cảm giác "trông có vẻ đúng". Mỗi kết luận phải có một con số hoặc một dòng response đi kèm: status code, `Content-Length`, `meta.total`, giá trị trong cơ sở dữ liệu.
4. **Ghi lại** — viết vào nhật ký ngay khi còn nhớ lý do, kể cả khi kết luận là "chưa hiểu, để lại sau".

### Công cụ kiểm thử tôi dùng nhiều nhất

| Công cụ | Dùng để làm gì |
|---|---|
| **Postman** | Kiểm ma trận API theo vai trò: cùng một endpoint gọi bằng token của học viên, giảng viên, quản trị và không token, đối chiếu status code. Đây là cách duy nhất kiểm được quyền **phía máy chủ** — giao diện chặn được không có nghĩa API chặn được |
| **Chrome DevTools (F12)** | Tab **Network** để đọc query string, status code, response headers; tab **Console** để bắt lỗi JavaScript; tab **Application → Local Storage** để xem token; bật **Keep log** khi cần so nhiều bước liên tiếp; **throttling** để giả lập mạng chậm |
| **localhost (`:3000` + `:5173`)** | Môi trường thử chính. Mọi thao tác ghi dữ liệu đều chỉ làm ở đây, không bao giờ làm trên bản đang chạy thật |
| **Docker + Adminer** | PostgreSQL cổng `5433` trong container để không đụng PostgreSQL đã cài trên máy; Adminer ở `:8080` để xem bảng nhanh |
| **`psql` trong container** | Khi cần con số chính xác, tôi truy vấn thẳng cơ sở dữ liệu thay vì tin giao diện. Ví dụ kiểm mật khẩu có được băm thật không, hay kiểm phiên đăng nhập đã bị thu hồi chưa |
| **Kiểm thử tự động** | Backend: 12 script `ts-node` chạy bằng `npm test` — **357 phép khẳng định**. Frontend: `vitest` — 4 tệp / 13 test. Playwright cho 6 kịch bản E2E |

---

## 3. Dòng thời gian và những gì học được ở mỗi mốc

### 22/08 — Commit đầu tiên: dựng bộ xương full-stack

Tạo cấu trúc `backend/` (Node.js · Express · TypeScript · Prisma) và `frontend/` (React 19 · Vite · MUI). Quyết định sớm nhất và về sau thấy là đúng: **đặt tiền tố phiên bản `/api/v1` cho toàn bộ API** ngay từ đầu, thay vì thêm sau.

### 28/08 — Đưa lên môi trường thật, và bốn lần sửa cấu hình triển khai

Frontend lên Vercel, backend và PostgreSQL lên Render. Phần này tốn nhiều lần thử vì cấu hình triển khai chỉ báo lỗi khi build thật:

| Vấn đề gặp phải | Nguyên nhân tôi tìm ra |
|---|---|
| Build backend trên Render thiếu công cụ biên dịch | `npm ci` mặc định bỏ `devDependencies`; phải thêm `--include=dev` vào `buildCommand` |
| Cơ sở dữ liệu ở vùng xa, truy vấn chậm | Chưa khai báo `region` trong `render.yaml` → đặt về Singapore |
| **CI đỏ liên tục từ trước mà tôi không hiểu vì sao** | `prisma validate` **vẫn đọc biến `DATABASE_URL`** dù nó không hề kết nối tới cơ sở dữ liệu thật. Phải khai báo biến này ở cấp job của workflow. Bài học: đọc kỹ công cụ cần gì, đừng suy luận "nó không kết nối thì chắc không cần biến" |

Cùng đợt này thêm Vercel Speed Insights, Web Analytics và một job GitHub Actions ping uptime.

### 30/08 — Hai phát hiện từ việc đọc lại tài liệu nhà cung cấp

1. **Model AI đang dùng đã bị ngừng.** `gemini-2.0-flash` bị Google ngừng hoạt động từ 01/06/2026 → chuyển sang `gemini-3.6-flash`. Nếu không đọc lại trang model của Google thì tới ngày bảo vệ mới phát hiện.
2. **Cơ sở dữ liệu Render gói miễn phí có hạn dùng ~27/09/2026** → ghi vào tài liệu như một mốc cứng, và là lý do phải bảo vệ trước ngày đó.

Cũng phát hiện tài liệu của mình ghi sai cổng PostgreSQL cục bộ: viết `5432` trong khi `docker-compose.yml` mở `5433`. Sai một chữ số trong hướng dẫn thì người khác dựng lại sẽ thất bại — từ đó tôi tập thói quen **đối chiếu tài liệu với tệp cấu hình thật**, không viết theo trí nhớ.

### 31/08 – 01/09 — Tự soát lại toàn hệ thống: 12 điểm phải sửa

Đây là giai đoạn tôi học được nhiều nhất. Tôi tự soát lại theo hướng "nếu là người chấm, tôi sẽ tấn công vào đâu", và tìm ra 12 điểm (đánh số F1–F12), trong đó nhóm nghiệp vụ đáng chú ý:

- **F1 — Lộ trình học bị bỏ qua:** học viên có thể mở bài 3 mà chưa hoàn thành bài 1 và 2. Phải khóa theo thứ tự bài.
- **F2 — Vòng duyệt nội dung chưa đóng:** giảng viên sửa khóa đã `published` mà không phải duyệt lại.
- **F3 — Xóa cứng làm mất dữ liệu học tập:** xóa khóa học kéo theo mất tiến độ và bài nộp của học viên → chuyển sang chặn xóa khi đã có người học.
- **F4, F5 — Đua dữ liệu khi nộp quiz:** hai request nộp gần nhau có thể ghi hai bản. Sửa bằng **transaction mức `serializable`**. Đây là chỗ tôi phải đọc lại về mức cô lập giao dịch mới hiểu vì sao `read committed` không đủ.
- **F7 — Làm lại sau khi đã đạt:** cho phép làm lại vô hạn kể cả khi đã qua điểm sàn.
- **F8 — Sửa điểm sàn hồi tố:** đổi `passScore` làm kết quả cũ bị đánh giá lại theo tiêu chí mới.
- **F9 — Gửi duyệt khóa chưa đủ nội dung:** phải kiểm tính đầy đủ trước khi cho gửi.
- **F11, F12 — Chất lượng mã:** lazy-load route để giảm gói tải, thêm ESLint vào cổng CI.

Sau đợt này số phép kiểm tăng từ 318 lên 344.

### 02/09 — Một lỗi chỉ xuất hiện sau proxy

`express-rate-limit` cảnh báo sai địa chỉ IP khi chạy sau Render. Nguyên nhân: Render đặt một proxy phía trước, IP thật nằm trong header `X-Forwarded-For`, phải bật `trust proxy`. **Lỗi này không tái hiện được trên localhost** — chỉ thấy khi đọc log của môi trường thật. Bài học: có một lớp lỗi chỉ tồn tại khi có hạ tầng thật ở giữa.

### 05/09 — Hiệu năng, và một lỗi giao diện tôi phải truy nguyên bằng E2E

- **N+1 query ở thống kê lớp học:** trang thống kê gọi một truy vấn cho danh sách rồi thêm một truy vấn cho từng dòng. Gộp lại bằng `include`/`_count`. Đọc log truy vấn của Prisma là cách tôi nhìn ra.
- **Điểm trung bình bị làm tròn hai lần:** làm tròn ở bước trung gian rồi lại làm tròn ở bước cuối → lệch. Bỏ làm tròn trung gian.
- **Ô tìm kiếm bị ghi đè khi đổi từ khóa liên tiếp** (commit `6f3d746`): kịch bản E2E "Back khôi phục từ khóa" đỏ. Truy nguyên: khi người dùng gõ từ khóa mới trong lúc request cũ chưa về, response cũ về sau ghi đè trạng thái mới. Sau khi sửa, tôi giữ lại đúng kịch bản này thành **ca hồi quy S05**, có bước bật throttling 3000 ms để cố tình tạo lại tình huống đua.

Giai đoạn này tôi cũng phát hiện **7 khóa ngoại chưa được đánh chỉ mục** và ghi vào hồ sơ như một giới hạn tự nhận, kèm giải trình.

### 06/09 — Hai ca hồi quy, và một buổi mất thời gian vì xác thực Git

Chạy lại **S05** và **S06** trên môi trường cục bộ: cả hai PASS toàn bộ. Riêng S06 xác nhận một điều tôi từng làm sai: khi đăng nhập sai mật khẩu, ứng dụng **không** được gọi `/auth/refresh` rồi tải lại trang — lỗi phải giữ tại form.

Cùng ngày mất khá nhiều thời gian vì đẩy lên GitHub thất bại. Nguyên nhân thật không phải mật khẩu mà là **một credential helper `gh` đã hết hạn** còn nằm trong cấu hình Git; gỡ helper đó là xong. Bài học: khi thông báo lỗi nói về xác thực, hãy kiểm **toàn bộ chuỗi cấu hình** chứ không chỉ thông tin đăng nhập.

### 08/09 — Siết bảo mật ở biên HTTP, và mở rộng dữ liệu mẫu

- **CORS:** ở môi trường thật chỉ còn cho đúng một origin (`env.feUrl`), không dùng `*`.
- **Lỗi thân request:** JSON sai cú pháp phải trả **400**, thân vượt 1 MiB phải trả **413** — trước đó cả hai rơi vào nhánh 500. Viết `httpBoundary.test.ts` để giữ hành vi này.
- **Dữ liệu mẫu mở rộng** lên 7 khóa học / 5 giảng viên / 6 danh mục, có đủ ba trạng thái `published`, `pending`, `draft` để kiểm được vòng duyệt.
- **`totalPages` khi không có kết quả:** API từng trả `1`, nay trả `0` — trung thực hơn với dữ liệu.

**Chạy ca P01 của bộ kiểm tra tay: PASS 12/12 bước, 64 mục kiểm.** Điểm tôi tâm đắc nhất trong ca này: khách mở một khóa `pending` nhận **404 chứ không phải 403**. Tôi chọn 404 có chủ đích — 403 sẽ xác nhận "khóa này tồn tại nhưng bạn không được xem", cho phép người ngoài dò ID hợp lệ.

Cũng trong ngày này tôi vấp một bài học về hồ sơ: sửa vùng nhấp của logo cho đẹp hơn thì **thêm 9 dòng** vào `Header.tsx`, kéo số dòng front-end từ 6.215 lên 6.224 — lệch với bảng số liệu đã in trong báo cáo và slide. Tôi **hoàn tác** bản sửa đó. Từ đây tôi ghi thành nguyên tắc: **sát ngày bảo vệ, chỉ những sửa đổi nằm gọn trong một dòng có sẵn mới là "miễn phí"**; thêm hoặc bớt dòng là thay đổi hồ sơ, không chỉ thay đổi mã.

### 09/09 — Hoàn tất nhóm kiểm thử xác thực (mục 1)

Chạy bốn ca **AU01** (đăng ký), **AU02** (đăng nhập sai/đúng/đăng xuất), **AU03** (ma trận quyền giao diện), **AU04** (phiên hết hạn) — **tất cả PASS**. Cộng với P01, S05, S06 và nhóm build/kiểm thử tự động: **8 ca PASS, 0 FAIL, 0 BLOCKED**.

Những bằng chứng tôi thu được và sẽ trình bày khi bảo vệ:

| Điều được chứng minh | Cách kiểm |
|---|---|
| Mật khẩu lưu dạng băm, không lưu thô | Truy vấn `psql`: cột `password` dài **60** ký tự, tiền tố `$2a$10$` → **bcrypt cost 10** |
| Response không bao giờ trả mật khẩu | Đọc tab Response của `login` và `/auth/me`: khối `user` chỉ có `id`, `name`, `email`, `avatar`, `role`, `isActive`, `createdAt`, `updatedAt` |
| Email trùng khi đăng ký trả đúng mã ngữ nghĩa | `POST /auth/register` → **409 Conflict**, thân chỉ **65 byte**, không lộ tên bảng, câu SQL hay stack trace |
| Vai trò gửi lên không thể leo thang | Đăng ký vai trò Giảng viên → DB ghi `role = instructor`; form không có lựa chọn Quản trị |
| Đăng xuất thu hồi phiên ở **cả hai** phía | Client xóa token; `psql` cho thấy `users.refresh_token` chuyển từ token 207 ký tự thành **`NULL`** |
| Chặn quyền không rò rỉ request | Vai sai gõ URL khu khác → `/403`, và tab Network **không có một request nào** tới API của khu đó |
| Danh sách riêng tư có phạm vi ở máy chủ | `GET /courses/mine` (giảng viên) và `GET /enrollments/me` (học viên) — không lấy hết rồi lọc ở client |
| Cơ chế refresh token gộp hàng đợi | Đặt tạm `JWT_ACCESS_EXPIRES=30s`, chờ hết hạn rồi mở trang gọi nhiều request: **đúng một** `/auth/refresh` cho cả nhóm, các request bị 401 được gọi lại thành công, **không** vòng lặp 401 |
| Refresh token hỏng thì xóa phiên, không treo | Thay `refreshToken` trong Local Storage bằng chuỗi rác → ứng dụng xóa cả hai token, về `/login`, Console sạch |

Tiến độ hiển thị cũng **tính tay khớp**: khóa có 3 bài, hoàn thành 1 bài → giao diện ghi `1/3 bài · 33%`; khóa 2 bài, chưa học → `0/2 bài · 0%`.

**Một lỗi tự tìm ra và sửa trong ngày:** ở trang quản lý người dùng, React ghi lỗi `<p> cannot contain a nested <div>`. Truy nguyên tới `AdminUsersPage.tsx`: một `Typography variant="body2"` (MUI kết xuất thành `<p>`) đang bọc một `Chip` (kết xuất thành `<div>`) — DOM không hợp lệ. Sửa bằng cách thêm `component="div"` **vào chính dòng có sẵn**, nên `git diff --stat` chỉ báo *1 insertion, 1 deletion*. Sau khi sửa: chạy lại đủ **7 cổng chất lượng** (đều xanh) và **đo lại số dòng** — trùng khớp tuyệt đối với bảng đã in trong hồ sơ.

---

## 4. Sáu bài học kỹ thuật tôi rút ra

1. **Mã trạng thái HTTP là một quyết định thiết kế, không phải chi tiết vụn.** 404 thay vì 403 cho tài nguyên chưa công khai; 409 thay vì 500 cho xung đột dữ liệu; 400 và 413 thay vì 500 cho lỗi thân request. Chọn sai mã là để lộ thông tin hoặc làm client không xử lý được.
2. **Kiểm quyền ở giao diện chỉ là trải nghiệm; kiểm quyền ở API mới là bảo mật.** Router chặn được thì người dùng thấy `/403`, nhưng ai biết gọi API trực tiếp vẫn phải bị chặn. Vì thế mọi ca kiểm quyền đều phải làm lại bằng Postman.
3. **Một số lỗi chỉ xuất hiện khi có mạng chậm, proxy hoặc thời gian thật.** Lỗi đua từ khóa tìm kiếm phải bật throttling mới thấy; lỗi `trust proxy` phải có proxy thật; cơ chế refresh phải chờ token hết hạn thật. Không thể suy luận thay cho thực nghiệm.
4. **Đừng tin giao diện, hãy soi dữ liệu.** Nhiều lần giao diện hiển thị đúng nhưng phía dưới sai (và một lần ngược lại: `logout` trả 401 mà phiên **vẫn** bị thu hồi đúng). Chỉ truy vấn cơ sở dữ liệu mới kết luận được.
5. **Tài liệu phải đối chiếu với cấu hình thật.** Cổng ghi sai một chữ số, số tệp lệch một đơn vị, tên công cụ kiểm thử ghi sai — mỗi lỗi nhỏ đó đều làm người đọc dựng lại thất bại hoặc trả lời sai khi bị hỏi.
6. **Không hiểu thì không nhận là đã xong.** Có những chỗ tôi chưa kiểm chứng được và ghi thẳng là chưa: ví dụ thứ tự sắp xếp theo tên chưa chứng minh được với collation tiếng Việt, vì bốn khóa `published` đều bắt đầu bằng chữ không dấu.

---

## 5. Công cụ hỗ trợ AI và giới hạn sử dụng

Tôi công khai đầy đủ phần này để hội đồng đánh giá đúng công sức và đúng năng lực.

### Đã dùng những công cụ nào

| Công cụ | Phiên bản | Dùng vào việc gì |
|---|---|---|
| **ChatGPT** | bản miễn phí | Tra cứu cú pháp và khái niệm khi gặp lần đầu (mức cô lập giao dịch, `trust proxy`, cách viết truy vấn Prisma tránh N+1); giải thích thông báo lỗi dài |
| **Claude** | bản miễn phí | Đọc và giải thích đoạn mã dài; soạn nháp tài liệu tiếng Việt; hỗ trợ ghi biên bản trong lúc tôi tự chạy các ca kiểm thử tay |
| **GitHub Copilot** | trong VS Code | Gợi ý hoàn thành dòng khi viết mã lặp lại (khai báo kiểu, mẫu try/catch, tên biến) |

### Việc tôi tự làm, không dùng AI thay

- **Thiết kế cơ sở dữ liệu** 11 bảng và các quyết định về khóa ngoại, chỉ mục, quy tắc xóa.
- **Quyết định kiến trúc:** tách `/api/v1`, phân lớp controller–service, chọn JWT hai token với hàng đợi refresh, chọn Render + Vercel.
- **Toàn bộ việc kiểm thử:** viết kịch bản kiểm tra tay, gọi Postman, đọc F12, truy vấn cơ sở dữ liệu, và **kết luận đạt hay không đạt**.
- **Quyết định sửa hay không sửa.** Ví dụ rõ nhất: bản sửa vùng nhấp logo chạy đúng và mọi cổng chất lượng vẫn xanh, nhưng tôi **hoàn tác** vì nó làm lệch số liệu đã in trong hồ sơ. Đó là đánh đổi mà chỉ người chịu trách nhiệm về đồ án mới quyết được.
- **Giải trình mọi dòng mã khi bị hỏi.** Đây là tiêu chí tôi tự đặt: nếu một đoạn mã tôi không giải thích được thì tôi viết lại cho tới khi hiểu, chứ không giữ lại vì "nó chạy".

### Nguyên tắc kiểm chứng tôi áp dụng

1. **Mọi gợi ý của AI đều phải chạy thật mới được nhận.** Chạy trên localhost, gọi bằng Postman, hoặc có một phép kiểm tự động bảo vệ.
2. **AI đã đưa thông tin sai và tôi đã bắt được.** Vài lần Copilot gợi ý tên trường không có trong schema Prisma; vài lần lời giải thích về hành vi thư viện không khớp tài liệu chính thức. Vì thế **tài liệu chính thức của thư viện luôn thắng** lời giải thích của AI.
3. **Con số trong hồ sơ phải do tôi đo, không do AI phát biểu.** Số dòng đo bằng cách đếm ký tự xuống dòng; số tệp đếm bằng `git ls-files`; số phép kiểm lấy từ output thật của `npm test`. Đã hai lần tôi phát hiện số liệu trong hồ sơ lệch so với mã nguồn và phải sửa hồ sơ.
4. **Không đưa dữ liệu thật hay khóa bí mật cho công cụ ngoài.** Không dán JWT, refresh token, khóa Gemini, `DATABASE_URL` hay mật khẩu vào bất kỳ đâu; mọi thử nghiệm ghi dữ liệu chỉ làm trên cơ sở dữ liệu cục bộ.

Tóm lại: AI giúp tôi **học nhanh hơn và viết tài liệu gọn hơn**, nhưng phần **thiết kế, kiểm thử, kết luận và chịu trách nhiệm** là của tôi.

---

## 6. Số liệu chốt của sản phẩm

| Chỉ số | Giá trị |
|---|---|
| Tệp mã nguồn | **163** |
| Back-end | **4.307 dòng / 58 tệp** |
| Front-end | **6.215 dòng / 52 tệp** |
| Tổng TypeScript | **10.522 dòng** |
| Kiểm thử | **2.135 dòng / 19 tệp** |
| Phép khẳng định (backend `npm test`) | **357** |
| Kiểm thử frontend (`vitest`) | 4 tệp / 13 test |
| Kịch bản E2E (Playwright) | 6/6 đạt |
| Endpoint API | 46 |
| Bảng cơ sở dữ liệu | 11 |
| Lỗ hổng `npm audit` (cả hai phía) | **0** |
| Gói JavaScript lớn nhất sau build | 323,96 kB (gzip 102,86 kB) |

**Kết quả kiểm thử thủ công tới 09/09:** 8 ca PASS · 0 FAIL · 0 BLOCKED.

---

## 7. Việc còn lại

- Chạy nốt các nhóm kiểm thử tay: giảng viên tạo nội dung (I01–I03), luồng học viên (S01–S04), quản trị (A01–A04), ma trận API bằng Postman, tính năng AI, và kiểm giao diện đáp ứng.
- Xuất lại hai bản PDF cho khớp số liệu mới nhất.
- Bảo vệ **trước 27/09/2026** vì cơ sở dữ liệu Render gói miễn phí hết hạn sau ngày đó.

---

*Cập nhật lần cuối: 09/09/2026.*
