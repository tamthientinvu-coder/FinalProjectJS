# Hướng dẫn kiểm tra thủ công LearnQuiz

Cập nhật ngày 05/09/2026. Đây là hướng dẫn hiện hành; thay thế bản ngày 02/09.
Thực hiện trên local hoặc CSDL thử được phép ghi dữ liệu. Hướng dẫn là **kịch bản cần chạy**, không phải biên bản các ca đã đạt. Kết quả đã chạy nằm trong [nhật ký dự án](NHAT-KY-DU-AN.md).

## 0. Chuẩn bị và quy ước

### 0.1. Những gì cần có

1. Mở PowerShell; không dán các thông báo lỗi vào terminal như thể chúng là lệnh.
2. Vào thư mục gốc:
   ```powershell
   Set-Location C:\Users\vutam\Desktop\FinalProject
   rtk git status --short
   rtk git rev-parse HEAD
   rtk proxy node --version
   rtk proxy npm --version
   ```
3. Ghi commit, ngày kiểm tra, phiên bản Node/npm và trình duyệt vào bảng kết quả. CI dùng Node 22; dùng cùng nhánh Node để giảm khác biệt.
4. Chuẩn bị Chrome hoặc Edge, ba profile riêng: **HV**, **GV**, **QT**. Các cửa sổ ẩn danh của cùng trình duyệt có thể dùng chung phiên; không xem chúng là ba tài khoản độc lập.
5. Cần PostgreSQL local và quyền tạo dữ liệu thử. Chưa có DB thì các ca nghiệp vụ ghi **BLOCKED**, không ghi FAIL cho project.
6. Gemini key chỉ cần cho nhóm AI. Không đưa key vào frontend hoặc ảnh bằng chứng.
7. Các lệnh dưới đây dùng RTK theo quy ước project. Nếu máy khác không có RTK, bỏ tiền tố `rtk`; với `rtk proxy`, bỏ cả hai từ này.

### 0.2. Dựng DB

1. Mở Docker Desktop và chờ engine sẵn sàng.
2. Ở thư mục gốc chạy:
   ```powershell
   rtk docker ps
   rtk docker compose up -d
   rtk docker compose ps
   ```
3. Đợi dịch vụ `db` chuyển healthy. Nếu báo không tìm thấy pipe Docker, engine chưa hoạt động; đây không phải lỗi migration.
4. Cấu hình mặc định: PostgreSQL cổng **5433**, database **learnquiz_db**, Adminer **8080**. Dùng PostgreSQL cài riêng thì chỉnh URL cho đúng.
5. Không chạy `docker compose down -v` để xử lý lỗi: tùy chọn `-v` xóa volume dữ liệu.
6. Không chạy đồng thời hai cấu hình Docker mặc định: Adminer và frontend full-stack cùng dùng cổng 8080.

### 0.3. Khởi động backend — terminal A

```powershell
Set-Location C:\Users\vutam\Desktop\FinalProject\backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
rtk npm ci
rtk npx prisma generate
```

1. Mở `backend/.env` bằng trình soạn thảo. Không ghi đè file đang có cấu hình riêng.
2. Xác nhận `DATABASE_URL` trỏ DB **local được phép thử**; không chỉ nhìn tên file rồi cho rằng đó là local.
3. Thay hai JWT secret mẫu bằng hai chuỗi ngẫu nhiên khác nhau. Có thể chạy lệnh sau hai lần rồi tự chép vào đúng biến; không gửi kết quả vào báo cáo:
   ```powershell
   rtk proxy node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Đặt `FE_URL=http://localhost:5173`; để trống Gemini key nếu chưa kiểm tra AI.
5. Áp dụng migration đã có, không tạo migration mới chỉ để chạy dự án:
   ```powershell
   rtk npx prisma validate
   rtk npx prisma migrate deploy
   rtk npx prisma migrate status
   ```
6. Nếu DB thử **rỗng hoặc được phép xóa toàn bộ dữ liệu nghiệp vụ**, chạy `rtk npm run seed`. Seed có thao tác xóa dữ liệu; không dùng trên DB đang chứa công việc cần giữ. Nếu không được xóa, dùng dữ liệu mới tạo qua UI và tài khoản quản trị của môi trường.
7. Chạy `rtk npm run dev`, giữ terminal A mở.
8. Trong terminal khác:
   ```powershell
   Invoke-RestMethod http://localhost:3000/health
   ```
9. Kỳ vọng HTTP 200, `status=ok`, `db=up`; có thể có thêm `uptime`. HTTP 503 với `db=down` là DB chưa kết nối được. Ghi lỗi cụ thể rồi xử lý URL/port/dịch vụ, không tự kết luận schema drift.

### 0.4. Khởi động frontend — terminal B

```powershell
Set-Location C:\Users\vutam\Desktop\FinalProject\frontend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
rtk npm ci
rtk npm run dev
```

1. Xác nhận `frontend/.env` có `VITE_API_URL=http://localhost:3000/api/v1`.
2. Mở **http://localhost:5173**. Dùng đúng hostname này để khớp CORS.
3. Nhấn F12 → Network → bật **Preserve log**, chọn Fetch/XHR. Mở Console.
4. Reload. Kỳ vọng không trắng trang, không lỗi CORS. Lưu ảnh lỗi nếu có.
5. Nếu sửa biến `VITE_*`, khởi động lại Vite. Với bản build, phải build lại.

### 0.5. Tài khoản và cách ghi ID

Sau khi seed DB thử, mật khẩu chung là `123456`:

| Profile | Email | Vai trò |
|---|---|---|
| QT | admin@learnquiz.vn | Admin |
| GV | instructor@learnquiz.vn | Instructor |
| GV2 | instructor2@learnquiz.vn | Instructor khác |
| HV | student@learnquiz.vn | Student |
| HV2 | student2@learnquiz.vn | Student khác |

- Seed có thể chạy nhiều lần mà sequence không trở về 1. **Không đoán ID**.
- ID khóa lấy từ URL `/courses/<courseId>`; ID bài từ URL editor/Network; ID quiz từ response GET quiz; ID bài nộp từ `/quiz-result/<submissionId>`.
- Route UI `/quiz/:lessonId` nhận **ID bài học**, API nộp `/quiz/:quizId/submit` nhận **ID quiz**.
- Tạo một bản sao của [mẫu kết quả](MAU-KET-QUA-KIEM-TRA.md), ghi ID tại đó.

## 1. Khách và xác thực

### P01 — Trang công khai, tìm kiếm và bộ lọc

1. Profile chưa đăng nhập mở `/`, nhấn logo, mở `/courses`.
2. Ghi số khóa ban đầu. Chỉ khóa published được xuất hiện.
3. Nhập một phần tên khóa vào ô **Tìm theo tên khóa học**, nhấn Enter.
4. Chọn danh mục, độ khó; lần lượt chọn Mới nhất, Cũ nhất, Theo tên A→Z.
5. Sau mỗi lần đổi, xem URL và request GET courses; các tham số phải khớp lựa chọn.
6. Reload cùng URL: kết quả giữ bộ lọc. Thử Back/Forward và đối chiếu cả ô nhập với URL; ghi FAIL nếu ô nhập giữ từ khóa cũ.
7. Nhập chuỗi không có kết quả; kỳ vọng trạng thái rỗng rõ ràng.
8. Nhấn **Xóa lọc**; danh sách trở về trạng thái mặc định.
9. Nếu có hơn 9 khóa published, chuyển trang 2 rồi đổi bộ lọc: phải về trang 1, không lặp/mất khóa.
10. Mở chi tiết khóa. Khách xem thông tin và tiêu đề bài; không nhận nội dung bài/đáp án quiz qua response công khai.
11. Gõ `/my-courses`: về login. Gõ một URL không tồn tại: trang 404 có nút về nhà.
12. Bằng chứng: URL bộ lọc, ảnh danh sách, response courses đã bỏ thông tin nhạy cảm.

### AU01 — Đăng ký

1. Mở `/register`; submit form rỗng, ghi lỗi từng trường.
2. Thử tên 1 ký tự, email sai dạng, mật khẩu 5 ký tự. Mỗi lần chỉ sửa một trường sai để phân biệt nguyên nhân.
3. Đăng ký tên `QA Học viên`, email mới `qa-hv-<mốc-thời-gian>@example.com`, mật khẩu từ 6 ký tự, vai trò Student.
4. Kỳ vọng đăng ký thành công; đăng nhập tài khoản vừa tạo, kiểm menu học viên.
5. Đăng ký lại cùng email: báo xung đột, không 500.
6. Lặp lại với Instructor và email khác; vào được trang giảng viên.
7. Không có lựa chọn Admin trên form. Ca sửa request thành role admin nằm ở nhóm API.
8. Không ghi mật khẩu thật vào bảng kết quả.

### AU02 — Đăng nhập sai, đúng, đăng xuất

1. Mở `/login`, nhập email không tồn tại + mật khẩu; submit.
2. Ghi thông báo; nhập email tồn tại + mật khẩu sai.
3. Kỳ vọng cùng thông báo **Email hoặc mật khẩu không đúng**, giữ lỗi tại form; không tải lại trang, không phát sinh request refresh do sai mật khẩu.
4. Đăng nhập đúng từng vai trò; kiểm tên/menu tại dashboard.
5. Nhấn đăng xuất; mở lại route bảo vệ và dùng nút Back.
6. Kỳ vọng không truy cập lại dữ liệu bảo vệ bằng phiên frontend đã xóa.
7. Lưu ý logout hiện thu hồi refresh token; access token cũ không mặc nhiên bị thu hồi trước thời hạn. Không dùng hành vi này làm bằng chứng “mọi token bị vô hiệu ngay”.

### AU03 — Ma trận quyền giao diện

Đăng nhập từng profile, **gõ URL trực tiếp**, không chỉ kiểm menu:

| Vai trò | URL | Kỳ vọng |
|---|---|---|
| Khách | /my-courses | /login |
| Student | /instructor/courses | /403 |
| Student hoặc Instructor | /admin/users | /403 |
| Instructor hoặc Admin | /my-courses | /403 |
| Admin | /admin, /admin/courses, /admin/users, /admin/categories | mở được |
| Instructor | /instructor/courses | mở được |
| Admin | /instructor/courses | mở được |

Quyền sở hữu phải kiểm thêm bằng API; route vào được không có nghĩa được sửa mọi khóa.

### AU04 — Phiên hết hạn

1. Chỉ ở local, tạm đặt `JWT_ACCESS_EXPIRES=30s`, restart backend rồi đăng nhập lại để lấy token mới.
2. Đợi hơn 30 giây; mở trang có nhiều request, quan sát Network.
3. Kỳ vọng một request refresh cho nhóm request đồng thời; các request được chạy lại thành công, không vòng lặp 401.
4. Trong DevTools Application → Local Storage, thay refreshToken bằng chuỗi không hợp lệ. Đợi access token hết hạn rồi thao tác.
5. Kỳ vọng xóa phiên và về login; không treo hàng đợi. Request refresh có thời gian chờ tối đa 15 giây.
6. Trả cấu hình thời hạn về giá trị ban đầu, restart backend, đăng nhập lại.

## 2. Tạo bộ dữ liệu kiểm tra có thể tính tay

Dùng **khóa mới riêng cho mỗi vòng** để không phụ thuộc lịch sử seed. Tên đề xuất `QA-YYYYMMDD-HHMM`.

### I01 — Tạo khóa và bài học

1. GV vào `/instructor/courses`, bấm tạo khóa.
2. Thử tên dưới 5 ký tự và URL ảnh sai; kỳ vọng lỗi validation.
3. Tạo khóa tên QA, mô tả đủ ý, danh mục có thật, ảnh URL hợp lệ, độ khó beginner.
4. Reload danh sách: khóa còn và ở draft.
5. Mở quản lý bài học tại `/instructor/courses/<courseId>/lessons`.
6. Tạo **Bài A — Biến**, **Bài B — Hàm**, **Bài C — Ôn tập**; mỗi bài có nội dung phân biệt rõ.
7. Bài A thêm URL video hợp lệ. Giao diện hiện liên kết mở tab mới; không yêu cầu trình phát nhúng vì mã hiện tại dùng link.
8. Đổi thứ tự C-A-B bằng nút sắp xếp đang có; reload, xác nhận thứ tự; đổi lại A-B-C.
9. Hủy dialog xóa B; B phải còn.
10. Tạo bài phụ D chưa có tiến độ, xóa D rồi reload; D biến mất, A-B-C còn.
11. Ghi courseId và ba lessonId vào bảng.

### I02 — Tạo quiz cho Bài A

1. Mở soạn quiz của A tại `/instructor/lessons/<lessonId>/quiz`.
2. Đặt tên `Quiz QA A`, điểm đạt **70**, số lượt tối đa **3**.
3. Tạo bốn câu; mỗi câu bốn đáp án, đúng một đáp án đúng. Dùng bảng mẫu:

| Câu | Nội dung | A | B | C | D | Đáp án đúng |
|---|---|---|---|---|---|---|
| 1 | Kết quả của 1 + 1 là gì? | 2 | 3 | 4 | 5 | A |
| 2 | Kết quả của 2 + 2 là gì? | 3 | 4 | 5 | 6 | B |
| 3 | Kết quả của 3 + 3 là gì? | 4 | 5 | 6 | 7 | C |
| 4 | Kết quả của 4 + 4 là gì? | 5 | 6 | 7 | 8 | D |

4. Lưu, reload: tên, điểm đạt, số lượt và đáp án giữ nguyên.
5. Trước khi có bài nộp, thử sửa câu và lưu lại; xác nhận thay đổi được.
6. Kiểm validation bằng form hoặc Postman khi form không cho tạo dữ liệu sai: 0 câu; 3/5 đáp án; 0/2 đáp án đúng; câu dưới 5 ký tự; passScore -1/101; maxAttempts 0/21. Kỳ vọng 400 ở API, không lưu một phần.
7. Trả quiz về bộ dữ liệu trên. Lưu đáp án ở phiếu GV, không xem đáp án editor bằng tài khoản HV.
8. Tạo quiz B tương tự để kiểm điểm trung bình nhiều quiz nếu cần.

### I03 — Gửi duyệt và tính đầy đủ

1. Tạo một khóa phụ thiếu mô tả/ảnh/danh mục/bài học; gửi duyệt.
2. Kỳ vọng 409 và chỉ rõ phần còn thiếu. Không coi “tạo draft được” là lỗi.
3. Quay lại khóa QA đầy đủ A-B-C, gửi duyệt: chuyển pending.
4. Trong lúc pending, thử sửa khóa, bài, quiz bằng GV; kỳ vọng bị chặn.
5. Chuyển QT sang hàng đợi; tìm chính xác tên QA.
6. Đối chiếu nội dung rồi duyệt. Khóa chuyển published và xuất hiện trên trang công khai sau reload.
7. Giữ khóa published để làm nhóm học viên; thử vòng sửa/gỡ sau khi hoàn tất nhóm này.

## 3. Học viên — luồng chính và các biên

### S01 — Đăng ký học và mở khóa bài

1. HV mới/chưa ghi danh vào chi tiết khóa QA; bấm **Đăng ký học**.
2. Kỳ vọng chuyển nút sang vào học; `/my-courses` chỉ có một bản ghi QA.
3. Reload rồi gọi enroll lại: HTTP 409; không tạo bản ghi trùng, không 500.
4. Vào `/learn/<courseId>`: A mở, B/C khóa, tiến độ 0/3.
5. Gõ `?lesson=<lessonId-B>` hoặc gọi API nội dung B: không đọc được bài chưa mở khóa.
6. Mở A, đọc nội dung, thử link video. Đánh dấu hoàn thành A.
7. Kỳ vọng 1/3, **33%**; B mở. Reload để xác nhận lưu vào DB.
8. Hoàn thành B: 2/3, **67%**; C mở. Hoàn thành C: 3/3, **100%**.
9. Trở lại A và bỏ hoàn thành: 2/3, **67%**; B/C bị khóa theo lộ trình, lịch sử hoàn thành/quiz không bị xóa tự động.
10. Đánh dấu A lại để tiếp tục các ca sau.

### S02 — Chấm điểm, xem lại và làm lại

1. Mở quiz A bằng HV; mở Network trước khi nộp.
2. Chọn request GET `/lessons/<lessonId>/quiz` → Response. Trong `questions[].choices[]` chỉ có id/text, không có isCorrect.
3. Lượt 1: trả lời đúng hai câu, sai hai câu theo phiếu đáp án. Nộp.
4. Kỳ vọng **50 điểm**, **2/4**, chưa đạt, attemptNo=1; đến `/quiz-result/<submissionId>`.
5. Kiểm từng câu đã chọn, đúng/sai, đáp án đúng. Lưu submissionId.
6. Bấm làm lại. Lượt 2 trả lời đúng ba câu; kỳ vọng **75 điểm**, đạt, attemptNo=2.
7. Quay về đề: không còn được làm lại sau khi đạt; API submit tiếp phải 409 dù còn một lượt.
8. Mở `/my-courses`: nếu chỉ quiz A có bài nộp, điểm trung bình quiz là **75**, lấy lượt tốt nhất; không lấy (50+75)/2.
9. HV2 thử mở URL kết quả HV1: 403; không thấy đáp án riêng của người khác.
10. GV/QT có quyền đọc kết quả qua API theo quyền sở hữu; UI route quiz-result hiện chỉ dành Student.

### S03 — Hết lượt, bỏ trống, bấm lặp

1. Dùng HV2 chưa làm quiz A. Nộp ba lượt đều dưới 70.
2. Bỏ trống ít nhất một câu; câu đó tính sai, mẫu số vẫn là bốn.
3. Sau lượt 3: không thể làm lượt 4, API trả 409.
4. Dùng tài khoản thử khác bấm nộp nhanh hai lần; kiểm Network và bảng lịch sử.
5. Không được vượt giới hạn hoặc có hai bản ghi cùng attemptNo. **Hiện API không có idempotency key**: hai request hợp lệ nối tiếp khi chưa đạt/còn lượt có thể được tính hai lượt; ghi lại nếu xảy ra, không tuyên bố exactly-once.
6. Tạm ngắt mạng trước nộp; phải có lỗi, không tự hiển thị điểm giả. Khi nối lại, kiểm lịch sử trước khi nộp lại vì lần trước có thể đã tới server.

### S04 — Đổi bài nhanh

1. Khi A và B đã mở, DevTools đặt Slow 3G.
2. Bấm A rồi B liên tiếp, lặp vài lần.
3. Kỳ vọng URL B, tiêu đề/nội dung B, nút quiz và thao tác hoàn thành đều thuộc B.
4. Khi đang tóm tắt A hoặc lưu hoàn thành A, chuyển B.
5. Không được hiển thị bản tóm tắt A dưới tiêu đề B hoặc dùng trạng thái A để ghi nhầm B. Ghi FAIL nếu tái hiện; kèm thứ tự request.
6. Trả Network về No throttling.

### S05 — Đổi từ khóa tìm kiếm liên tiếp và bấm Back *(hồi quy cho lỗi đã vá `d8bf9f0`)*

Ca này dựng lại đúng một lỗi có thật đã được vá — người gõ nhanh từng thấy ô tìm kiếm tự nhảy về từ khóa cũ.

1. Vào `/courses`. Gõ `JavaScript` vào ô **Tìm theo tên khóa học**, nhấn `Enter`.
2. Kỳ vọng URL có `?search=JavaScript`, danh sách lọc theo từ này.
3. **Ngay lập tức, không chờ kết quả về**, xóa và gõ `React`, nhấn `Enter`.
4. Kỳ vọng URL đổi sang `?search=React`, ô tìm kiếm **vẫn giữ chữ `React`** — không được tự nhảy về `JavaScript`, và danh sách phải lọc theo `React`.
5. Bấm nút **Back** của trình duyệt.
6. Kỳ vọng URL trở về `?search=JavaScript`, ô tìm kiếm hiển thị lại `JavaScript`, danh sách lọc theo `JavaScript`. **Ba thứ — URL, ô tìm kiếm, danh sách kết quả — phải nói cùng một điều.**
7. Bấm **Forward**: cả ba quay lại `React`.
8. Lặp bước 1–6 với DevTools đặt Slow 3G để ép khe thời gian rộng ra.

Ghi FAIL nếu ở bất kỳ bước nào ô tìm kiếm lệch với URL hoặc với danh sách. Ca tự động tương ứng: `e2e/role-routing.spec.ts` — *"Back khôi phục từ khóa trong ô tìm kiếm"*.

### S06 — Sai mật khẩu phải giữ lỗi tại form *(hồi quy cho `axiosClient.ts`)*

1. Vào `/login`, nhập email đúng nhưng mật khẩu sai, bấm **Đăng nhập**.
2. Mở tab Network trước khi bấm.
3. Kỳ vọng: thông báo lỗi hiện **tại form**, trang không tải lại, và **không** có request nào tới `/auth/refresh`.
4. Lặp với email chưa từng đăng ký: thông báo không được tiết lộ email đó có tồn tại hay không.

Trước đây `401` từ `/auth/login` kích hoạt vòng làm mới token vô ích rồi tải lại trang, làm mất luôn thông báo lỗi.

## 4. Giảng viên và quản trị sau khi có dữ liệu

### I04 — Bảo toàn lịch sử và vòng duyệt lại

1. GV mở quiz A đã có bài nộp; thử thay bộ câu hỏi hoặc điểm đạt: 409.
2. Thử xóa quiz A, bài A có tiến độ, khóa QA có enrollment: 409.
3. Mở lại kết quả HV1; bài làm vẫn còn nguyên.
4. Thử sửa tên quiz/số lượt qua chức năng metadata được phép; phải giữ điểm/đáp án cũ.
5. GV sửa nội dung một bài của khóa published. Kỳ vọng khóa trở về draft và biến mất khỏi danh sách công khai.
6. Học viên đã enroll hiện vẫn có thể học qua `/learn/<courseId>`; đây là hành vi hiện hành của service. Không suy ra draft có nghĩa thu hồi quyền người đã enroll.
7. Gửi duyệt lại, QT duyệt lại; kiểm public trở lại.
8. GV2 thử sửa/xóa/đọc editor/thống kê khóa của GV: API 403.

### I05 — Tính thống kê bằng tay

1. Mở `/courses/<courseId>/stats` bằng GV.
2. Ghi tổng enrollment, bài học, quiz, submission; đếm từ dữ liệu vừa tạo.
3. Với mỗi quiz: số lượt, số học viên khác nhau, trung bình **mọi lượt**, cao nhất, số lượt đạt, tỷ lệ đạt.
4. Lấy tổng tất cả score chia tổng số submission, **làm tròn một lần cuối** để đối chiếu điểm trung bình lớp.
5. Ví dụ hai lượt 50 và 75: trung bình lớp 63, điểm tốt nhất trên trang HV là 75. Hai màn hình có cách tính khác nhau.
6. Tỷ lệ đạt = số lượt có score >= passScore / số lượt; không phải số học viên đạt / sĩ số.
7. Lớp rỗng phải có số đếm 0, điểm trung bình null/hiển thị chưa có dữ liệu; không NaN.
8. Truy vấn đếm lượt đạt đã được gom thành một groupBy; chưa dùng số truy vấn làm bằng chứng tốc độ thực nếu chưa đo PostgreSQL.

### A01 — Duyệt, từ chối, gỡ

1. QT mở `/admin/courses`, thử tìm theo tên khóa/tên GV, lọc từng trạng thái.
2. Chọn một pending, từ chối với lý do 9 ký tự: 400.
3. Nhập lý do 10–500 ký tự: rejected; GV xem được lý do và sửa/gửi lại.
4. Pending → publish thành công; publish published lần nữa phải 409.
5. Gỡ một published với lý do hợp lệ: trở về draft. Gỡ thiếu lý do bị chặn.
6. Reload và đối chiếu cả admin, instructor, public. Không chỉ nhìn toast thành công.

### A02 — Danh mục

1. QT mở `/admin/categories`, tạo `QA Danh mục <mốc>`, để slug trống.
2. Reload; slug tự sinh, bản ghi còn.
3. Sửa tên. Thử slug chữ hoa/dấu cách/trùng slug: lỗi 400/409 đúng loại.
4. Xóa danh mục chưa dùng: biến mất sau reload.
5. Thử xóa danh mục của khóa QA: 409, khóa không mất danh mục do thao tác bị chặn.
6. Hủy một dialog xóa: không gửi request DELETE.

### A03 — Khóa người dùng và bảo vệ admin

1. QT mở `/admin/users`, tìm email HV2; lọc role/trạng thái.
2. Kiểm response danh sách không có password/refreshToken.
3. HV2 giữ phiên đang đăng nhập ở profile riêng.
4. QT khóa HV2, HV2 gọi API bảo vệ bằng access token đang có: 403 ngay.
5. HV2 thử refresh và login: đều không được. QT mở khóa, HV2 login lại được.
6. QT thử tự khóa chính mình: UI ngăn hoặc API 409.
7. Ca hai admin khóa chéo chỉ thực hiện trên DB thử có hai admin chuẩn bị riêng; sau chạy phải còn ít nhất một admin active. Không đổi vai trò tài khoản đang dùng để kiểm thử nhóm khác.

### A04 — Tổng quan

1. QT mở `/admin`.
2. Đối chiếu user theo role, course theo status, tổng enrollment/submission, điểm trung bình với dữ liệu.
3. Top khóa nhiều học viên chỉ gồm published.
4. Sau mỗi thay đổi vừa thử, reload dashboard trước đối chiếu.

## 5. Kiểm API trực tiếp bằng Postman

Để tránh lỗi alias `curl` của Windows PowerShell, dùng Postman cho các ca gửi JSON, hoặc dùng `Invoke-RestMethod` như dưới. Lệnh lỗi HTTP 4xx không phải PowerShell bị hỏng.

### 5.1. Chuẩn bị request

1. Tạo collection local, biến `baseUrl=http://localhost:3000/api/v1`.
2. POST `{{baseUrl}}/auth/login`, Body → raw → JSON:
   ```json
   {"email":"student@learnquiz.vn","password":"123456"}
   ```
3. Lấy `data.accessToken`, đặt Authorization → Bearer Token. Không chụp token.
4. Tạo các request riêng cho HV, GV, GV2, QT; đừng ghi đè token rồi nhầm vai trò.
5. Từ dữ liệu UI, điền courseId, lessonId, quizId, questionId, submissionId thực tế.
6. Trước mỗi ca, ghi điều kiện đầu. Request bị chặn do hết lượt không chứng minh được kiểm tra chống gian lận điểm.

Ví dụ login local qua PowerShell, lưu token trong biến, không in ra:

```powershell
$qaBase = 'http://localhost:3000/api/v1'
$qaBody = @{ email='student@learnquiz.vn'; password='123456' } | ConvertTo-Json
$qaLogin = Invoke-RestMethod -Method Post -Uri "$qaBase/auth/login" -ContentType 'application/json' -Body $qaBody
$qaHeaders = @{ Authorization = "Bearer $($qaLogin.data.accessToken)" }
Invoke-RestMethod -Uri "$qaBase/enrollments/me" -Headers $qaHeaders
```

### 5.2. Ma trận API bắt buộc

| ID | Điều kiện và thao tác | Kỳ vọng |
|---|---|---|
| API01 | Không token gọi GET /enrollments/me | 401 |
| API02 | HV GET /lessons/{bài đang khóa} | 403, không lộ nội dung |
| API03 | HV PATCH /lessons/{bài đang khóa}/complete, body {"isCompleted":true} | 403, không tạo progress |
| API04 | GV POST /courses/{id}/enroll | 403 |
| API05 | GV2 PATCH /courses/{khóa GV}/, body tên hợp lệ; bỏ dấu / cuối nếu cần | 403 |
| API06 | GV PATCH /courses/{id}/publish | 403 |
| API07 | HV còn lượt POST /quiz/{quizId}/submit, câu thật nhưng choiceId=null, kèm score=100 | server tự chấm 0 cho phần bỏ trống, không tin score gửi |
| API08 | Hai answers cùng questionId | 400, không tăng lượt |
| API09 | questionId thuộc quiz khác | 400, không tăng lượt |
| API10 | choiceId thuộc câu khác, questionId đúng | tính sai/bỏ trống, không ăn điểm |
| API11 | HV2 GET /submissions/{bài HV1} | 403 |
| API12 | QT GET /users | không password/refreshToken |
| API13 | POST /auth/register với role=admin | 400, không tạo admin |
| API14 | Enroll lặp cùng HV/cùng khóa published | 409, chỉ một enrollment |
| API15 | Đổi passScore của quiz đã có bài nộp | 409 |
| API16 | Token sửa một ký tự gọi /auth/me | 401 |
| API17 | ID âm, chữ, số quá lớn không hợp lệ | 400 hoặc 404 theo validator/tài nguyên; không 500 |
| API18 | JSON sai cú pháp hoặc body quá lớn | phải ghi HTTP thực tế; nếu 500 thì FAIL về phân loại lỗi, không coi là PASS |

Ví dụ chống tự gửi điểm, **thay questionId bằng số thật**:

```json
{"answers":[{"questionId":123,"choiceId":null}],"score":100}
```

HTTP 409 là xung đột nghiệp vụ; HTTP 500 luôn cần điều tra, không chấp nhận “409/500 đều được”. Sau ca bị chặn, kiểm lại dữ liệu để chắc chắn không có ghi một phần.

## 6. AI Gemini

### AI01 — Không có key

1. Để trống key backend local, restart backend, **reload toàn trang frontend** để xóa cache trạng thái AI.
2. Vào học bài/kết quả quiz/editor.
3. Kỳ vọng thao tác AI bị vô hiệu hóa và có lý do; học/nộp bài thủ công vẫn chạy.
4. GET /ai/status báo configured=false. configured=true chỉ xác nhận có cấu hình, không chứng minh model/key/quota đang dùng được.

### AI02 — Ba chức năng với key thật

1. Đặt key chỉ ở backend; xác nhận model của môi trường với nhà cung cấp tại ngày kiểm, không mặc định tên model trong repo còn hoạt động.
2. Restart backend, reload frontend.
3. GV mở bài có nội dung, chọn sinh câu hỏi AI. Xem bản nháp, sửa một câu rồi lưu; mỗi câu phải bốn đáp án, một đúng.
4. HV mở bài có nội dung và bấm **Tóm tắt bài học**; kết quả phù hợp bài, không thay nội dung gốc.
5. HV mở bài nộp có câu sai, bấm **Vì sao sai?**; giải thích đúng câu và đáp án đã chọn.
6. Reload kết quả rồi xin giải thích lại cùng câu: đối chiếu DB Answer.aiExplanation/log server hoặc số lần gọi provider; tốc độ nhanh tự nó không chứng minh cache.
7. Ghi model, thời gian phản hồi, HTTP, nội dung đã che thông tin cá nhân; không ghi key.

### AI03 — Lỗi dịch vụ

Thử thiếu key, key sai hoặc lỗi mạng trên môi trường thử. Kỳ vọng UI báo lỗi và cho tiếp tục học; không mất bài đang soạn. Các test mock bao phủ provider 403/429/5xx/timeout nhưng không thay thế lần gọi thật.

## 7. Trải nghiệm, khả năng chịu lỗi và responsive

### UI01 — Màn hình

Kiểm login/register, danh sách/chi tiết, học/quiz/kết quả, editor khóa/bài/quiz, thống kê và bốn trang admin ở 360×800, 390×844, 768×1024, 1366×768.

1. F12 → Device toolbar, nhập kích thước.
2. Cuộn hết trang; không có nút bị che hoặc cuộn ngang ngoài bảng có chủ đích.
3. Mở dialog, nhập chuỗi dài, đóng/mở menu.
4. Zoom 200%; kiểm chữ, nhãn và nút.
5. Chụp màn hình khi FAIL; ghi route, kích thước và dữ liệu gây lỗi.

### UI02 — Bàn phím

1. Dùng Tab/Shift+Tab từ đầu form; mọi điều khiển cần thao tác đều tới được.
2. Enter submit; Space chọn radio; Escape đóng dialog mà không xóa.
3. Focus nhìn thấy, giữ trong dialog khi mở, trở về nút gọi khi đóng.
4. Đúng/sai quiz có chữ/icon, không chỉ dùng màu.

### UI03 — Mạng/DB và phục hồi

1. Dừng backend local bằng Ctrl+C, thao tác đọc dữ liệu; phải báo lỗi, không loading vô hạn.
2. Chạy backend lại, reload và thao tác; dữ liệu cũ còn.
3. Nếu dùng DB thử riêng, dừng DB rồi gọi health: 503/db=down; bật lại và health phải phục hồi.
4. Không tắt dịch vụ DB đang dùng chung cho công việc khác.
5. Thử refresh/deep link từng route trên bản preview. Muốn gọi API từ port preview phải cấu hình FE_URL khớp origin preview rồi trả lại sau kiểm.
6. Nhập tiếng Việt, dấu nháy và chuỗi `<script>alert(1)</script>` vào nội dung thử; phải hiện như chữ, không chạy script.
7. Bấm nhanh hai lần ở lưu/enroll/complete/submit; kiểm cả số request và dữ liệu sau reload.

## 8. Build, kiểm thử tự động và triển khai

### 8.0. Cách nhanh — một lệnh chạy hết phần tự động

```powershell
powershell -ExecutionPolicy Bypass -File "$HOME\Desktop\kiem-tra-learnquiz.ps1"
```

Script này (đặt ở Desktop, **cố ý để ngoài repo** để không làm đổi số tệp của dự án) chạy tuần tự: git sạch và đồng bộ → back-end `lint / typecheck / test / build / prisma validate / audit` → front-end `lint / typecheck / vitest / playwright / build / audit` → gọi thật `/health` và trang production; cuối cùng in một bảng ĐẠT/HỎNG.

Hai lưu ý kỹ thuật đã trả giá mới rút ra được:

1. **Phải ép UTF-8 trước khi gọi `npm`.** Trên PowerShell, `cmd /c npm test` trả output theo codepage 437 làm ký tự `✓` vỡ thành `?`, đếm ra 0 phép khẳng định dù test đạt hết. Phải đặt `[Console]::OutputEncoding = [Text.Encoding]::UTF8` và chèn `chcp 65001 >nul &` trước lệnh.
2. **Script cố ý gọi `npm` trần, không qua `rtk`.** `rtk` nén và lọc output, mà script lại cần đếm chính xác số dấu `✓` và bắt dòng `Tests N passed` — lọc mất là hỏng phép đếm. Khi kiểm bằng tay thì cứ dùng `rtk` cho gọn; khi để máy đếm thì dùng lệnh trần.

Script chỉ thay được phần tự động. Ba kịch bản giao diện, kiểm API trực tiếp và Gemini live vẫn phải bấm tay theo mục 1–7.

### 8.1. Chạy cổng chất lượng

Ở backend:

```powershell
Set-Location C:\Users\vutam\Desktop\FinalProject\backend
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npm run build
rtk npx prisma validate
rtk npm audit
```

Ở frontend:

```powershell
Set-Location C:\Users\vutam\Desktop\FinalProject\frontend
rtk npm run lint
rtk npm run typecheck
rtk npm test
rtk npx playwright install chromium
rtk npm run test:e2e
rtk npm run build
rtk npm audit
```

Mỗi lệnh phải exit 0. Ghi số test từ output thật; không suy ra từ số ghi trong README.

Mốc đối chiếu tại `f9e7798` (ngày 05/09/2026) — **để so sánh, không phải để chép vào báo cáo**: back-end **345** phép khẳng định, front-end **13** ca Vitest, Playwright **6** ca. Lệch so với mốc này nghĩa là đã có thay đổi mã nguồn: đo lại và cập nhật hồ sơ, đừng sửa con số cho khớp. Playwright hiện dùng API mock, không kiểm chứng PostgreSQL. Không chạy `npm test` ở root vì root không có package.json.

### 8.2. Docker full-stack

1. Dừng stack dev đang chiếm cổng trước khi thử; không xóa volume.
2. Ở root tạo .env từ .env.example **chỉ khi chưa có**, thay secret mẫu.
3. Chạy `rtk docker compose -f docker-compose.full.yml config --quiet`.
4. Chạy `rtk docker compose -f docker-compose.full.yml up --build`.
5. Mở frontend localhost:8080, API health localhost:3000/health.
6. Chỉ seed trong container nếu DB đó được phép xóa.
7. Lặp login → enroll → học → nộp quiz. Config hợp lệ chưa có nghĩa image build/runtime đã đạt.

### 8.3. Production — kiểm riêng

1. Ghi đúng URL và deployment commit trên dashboard được cấp quyền.
2. Mở frontend, F12 kiểm Console/Network; health phải báo db=up.
3. Xác nhận FE gọi đúng API HTTPS và CORS cho origin thực.
4. Kiểm deep link/reload và nội dung công khai.
5. Xác nhận migration, ngày hết hạn DB/quota/model trực tiếp trên dashboard tại ngày kiểm; không dùng mốc ngày cũ trong báo cáo làm hiện trạng.
6. Ca ghi dữ liệu/khóa người dùng/seed chạy trên staging được phép, không mặc nhiên chạy production.
7. Chỉ health 200 không đủ kết luận production-ready.

## 9. Kết quả và tiêu chí kết thúc

- PASS: đã chạy, kết quả đúng, có bằng chứng.
- FAIL: đã chạy, khác kỳ vọng; ghi bước tái hiện và tác động.
- BLOCKED: thiếu môi trường/dữ liệu hoặc bị chặn bởi ca trước.
- NOT RUN: chưa chạy.

Mỗi ca cần: commit + thay đổi chưa commit, ngày/giờ, môi trường, vai trò, điều kiện đầu, thao tác, mong đợi, thực tế, ảnh/request đã che bí mật.

| Yêu cầu | Ca truy vết |
|---|---|
| Xem/lọc khóa | P01 |
| Xác thực và quyền | AU01–AU04, API01–API18 |
| Enroll, lộ trình, tiến độ | S01 |
| Quiz/chấm điểm/lịch sử/làm lại | S02–S03 |
| Tạo khóa/bài/quiz | I01–I03 |
| Bảo toàn lịch sử, duyệt lại | I04 |
| Thống kê | I05, A04 |
| Quản trị khóa/category/user | A01–A03 |
| AI | AI01–AI03 |
| UI và phục hồi | S04, UI01–UI03 |
| Đồng bộ URL ↔ giao diện khi Back/Forward | **S05** |
| Xử lý lỗi đăng nhập tại form | **S06** |
| Build/Docker/production | Mục 8 |

Không kết luận đạt toàn bộ nếu còn ca bắt buộc BLOCKED/NOT RUN. Khi xong, cập nhật nhật ký bằng **kết quả thực tế**, không đổi toàn bộ checklist thành PASS chỉ vì test tự động xanh.
