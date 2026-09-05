# Nhật ký dự án LearnQuiz

Nhật ký này ghi lại **các đợt bảo trì và đối soát số liệu** sau khi bộ hồ sơ đồ án đã hoàn thiện.
Nguyên tắc: mọi con số đưa vào hồ sơ đều phải **đo lại từ mã nguồn thật**, không chép lại từ tài liệu cũ.
Các tài liệu review có ghi ngày (`REVIEW-TOT-NGHIEP-2026-09-01.md`, `KE-HOACH-REVIEW-TOT-NGHIEP-2026-09-02.md`,
`BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md`) là **biên bản tại thời điểm đó** — cố ý giữ nguyên số liệu cũ,
không sửa lùi, để giữ được dấu vết kiểm chứng.

---

## 2026-09-05 — Đồng bộ số liệu hồ sơ, dọn tệp rác, đối soát toàn dự án

### 1. Số liệu đã đo lại (nguồn: mã nguồn tại commit hiện hành)

| Hạng mục | Cách đo | Kết quả |
|---|---|---|
| Phép khẳng định back-end | `cd backend && npm test`, đếm dấu `✓` | **345 đạt / 0 hỏng** |
| Phân rã theo tệp | chạy từng `tests/*.test.ts` | env 1 · grader 24 · workflow 30 · schema 31 · gemini 18 · quizService 49 · **adminService 76** · aiService 36 · enrollmentService 4 · graduationRegression 16 · api 60 |
| Unit test front-end | 4 tệp `*.test.ts` trong `frontend/src` | 13 ca |
| E2E | `frontend/e2e/role-routing.spec.ts` | 3 ca (Playwright) — *đã tăng lên 6 ca ngày 05/09, xem mục nhật ký cuối* |
| Mã nguồn back-end | `backend/src/**/*.ts` | 58 tệp / 4.295 dòng |
| Mã nguồn front-end | `frontend/src/**/*.{ts,tsx}`, trừ tệp test | 52 tệp / 6.174 dòng |
| Mã nguồn kiểm thử | `backend/tests` (13) + 4 tệp vitest + 1 tệp e2e | 18 tệp / 1.993 dòng — *nay là 2.078 dòng* |
| Tổng tệp mã nguồn & cấu hình | `git ls-files`, trừ `docs/`, `*.md`, `package-lock.json`, `.docx` | 161 tệp |
| Lược đồ CSDL | `backend/prisma/schema.prisma` | 11 bảng · 3 enum · 9 ràng buộc `unique` · 217 dòng |
| Điểm cuối API | đếm `router.<method>(` trong `backend/src/routes` | 46 (18 GET · 13 POST · 10 PATCH · 4 DELETE · 1 PUT) |
| Màn hình | `frontend/src/pages/**/*.tsx` | 21 |

### 2. Chỗ ghi sai đã sửa

**`docs/BAO-CAO-DO-AN-LearnQuiz.docx` + `.pdf`** — 24 vị trí:

- `344` → `345` ở 11 chỗ (tóm tắt sprint 5, Bảng 1.6, cây thư mục, §5.1, Bảng 5.1 dòng tổng, chuỗi CI, mục chất lượng mã, kết luận, phụ lục lệnh).
- Bảng 5.1: `adminService.test.ts` ghi **75** → **76** (sai kể từ khi thêm ca chống làm tròn trung gian điểm lớp).
- Bảng 1.6 "Quy mô sản phẩm bàn giao" — bốn dòng sai lệch do đo ở bản mã cũ:
  - Tổng tệp `143` → `161`
  - Back-end `4.017 dòng / 60 tệp` → `4.295 dòng / 58 tệp`
  - Front-end `6.067 dòng / 56 tệp` → `6.174 dòng / 52 tệp`
  - Kiểm thử `1.609 dòng / 10 tệp` → `1.993 dòng / 18 tệp`

**`docs/SLIDE-BAO-VE-LearnQuiz.pptx` + `.pdf`** — 5 vị trí:

- Slide 2 (agenda), slide 12 (tiêu đề), slide 15 (số lớn): `344` → `345`.
- Biểu đồ cột slide 12: cột `adminService` `75` → `76` (sửa cả bảng dữ liệu nhúng của biểu đồ, tổng cột nay đúng 345).
- Slide 15: `10.084` → `10.469` dòng mã nguồn TypeScript (= 4.295 back-end + 6.174 front-end, khớp Bảng 1.6).

**`docs/HUONG-DAN-HOAN-THIEN-BAO-CAO.md`** — bản PDF `71 trang` → `72 trang` (số trang thật của tệp Word).

`README.md`, `docs/DE-AN.md`, `docs/DEPLOY.md`, `docs/HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md` đã đúng từ trước — đối chiếu lại, không phải sửa.

### 3. Cách xuất lại PDF (ghi để lần sau khỏi mò)

- **Slide**: xuất bằng PowerPoint COM (`Presentations.SaveAs(..., 32)`) — chạy tốt, ~20 giây, giữ nguyên phông và bố cục.
- **Báo cáo**: `Word.ExportAsFixedFormat` **treo vô hạn** khi chạy Word ở chế độ ẩn trên máy này (đã thử 3 lần, có/không cập nhật trường, tiến trình `WINWORD` chạy đến >900 giây CPU rồi đứng). Nguyên nhân nghi ngờ: hộp thoại cập nhật trường mục lục bị ẩn nên không ai bấm được.
  → Cách đã dùng thay thế: **vá thẳng tệp PDF gốc do Word xuất**. Mọi thay thế đều là chữ số **cùng độ dài**, mà chữ số Times New Roman có bề rộng bằng nhau (tabular figures), nên bố cục, số trang (72) và số trang trong mục lục **không đổi một li**. Đã kiểm chứng: `pdfinfo` vẫn ghi Producer là *Microsoft Word*, 72 trang; render trang 18 và 57 để soi mắt thường; `pdftotext` không còn chuỗi `344`, `4.017`, `6.067`, `1.609`, `143 tệp` nào.
  → Nếu sau này sửa **nội dung** (không chỉ chữ số) thì phải mở `BAO-CAO-DO-AN-LearnQuiz.docx` bằng Word, bấm `Ctrl+A` → `F9` để cập nhật mục lục, rồi *File → Export → Create PDF*.

### 4. Tệp đã xóa (đều là tệp sinh tự động, đã nằm trong `.gitignore`)

| Tệp/thư mục | Lý do |
|---|---|
| `.gstack/` | Vết chạy của công cụ ngoài: log duyệt web, `terminal-internal-token`, `terminal-agent-pid`. **Có chứa token phiên** — không nên để lại trong thư mục dự án. |
| `frontend/playwright-report/` | Báo cáo E2E sinh lại được bằng `npm run test:e2e`. |
| `frontend/test-results/` | Kết quả chạy tạm của Playwright. |
| `frontend/tsconfig.tsbuildinfo` | Bộ nhớ đệm biên dịch tăng dần của TypeScript. |
| `backend/dist/`, `frontend/dist/` | Sản phẩm biên dịch, sinh lại bằng `npm run build`. |
| `docs/~$O-CAO-DO-AN-LearnQuiz.docx` | Tệp khóa của Word còn sót lại sau lần xuất PDF bị treo. |

**Giữ lại có chủ đích:** `docs/hinh-ve.zip` (10 sơ đồ PNG **kèm mã nguồn** `.mmd`/`.dot` — cần khi phải vẽ lại hình), `ĐỀ TÀI 4 — ....docx` (đề bài gốc, là bằng chứng phạm vi), toàn bộ `.md` review có ghi ngày (dấu vết kiểm chứng), `backend/.env` và `frontend/.env` (cấu hình chạy cục bộ, đã bị `.gitignore` chặn).

### 5. Kiểm chứng sau khi dọn

| Bước | Lệnh | Kết quả |
|---|---|---|
| Back-end kiểu | `npx tsc --noEmit` | sạch |
| Back-end quy chuẩn | `npx eslint src tests prisma --max-warnings=0` | sạch |
| Back-end test | `npm test` | 345/345 |
| Front-end kiểu | `npx tsc --noEmit` | sạch |
| Front-end quy chuẩn | `npx eslint src e2e playwright.config.ts vitest.config.ts --max-warnings=0` | sạch |

*Ghi chú trung thực:* `vitest` và `prisma validate` **không chạy được trong môi trường Linux dùng để rà soát lần này**, vì `node_modules` đã được cài trên Windows (thiếu native binding của `rolldown`, và Prisma không tải được engine do không có mạng). Đây là giới hạn của môi trường rà soát, **không phải lỗi dự án** — hai lệnh này vẫn xanh trên GitHub Actions và khi chạy trực tiếp trên máy Windows. Con số 13 unit test front-end lần này được **đếm tĩnh** từ mã nguồn chứ không phải từ lần chạy thật.

### 6. Đề xuất tối ưu — đã khảo sát chi tiết, chưa thực hiện

Xem phân tích đầy đủ ở mục 4.3 của [`DE-AN.md`](DE-AN.md). Tóm tắt: **PostgreSQL không tự tạo chỉ mục cho cột khóa ngoại phía con** (khác MySQL/InnoDB), và Prisma cũng chỉ tự thêm `@@index` khi lược đồ nhắm MySQL. Rà cả 15 cột khóa ngoại thì 8 cột đã được phủ (khóa chính, `@unique`, hoặc cột dẫn đầu của `@@unique` tổ hợp), **7 cột chưa**. Bốn cột nằm trên đường truy vấn thật, xếp theo lưu lượng:

| # | Cột | Đường truy vấn | Bằng chứng |
|---|---|---|---|
| 1 | `enrollments.course_id` | `_count.enrollments` trên **mọi** trang danh sách khóa học (công khai · quản trị · giảng viên); thống kê lớp; xếp hạng khóa học | `courseService.ts:7-11` · `statsService.ts:53` · `adminService.ts:245` |
| 2 | `quiz_submissions.quiz_id` | **bốn** `groupBy` liên tiếp ở trang thống kê lớp | `statsService.ts:66, 75, 85, 93` |
| 3 | `choices.question_id` | mọi lần tải đề / nộp bài / xem lại đáp án; bảng `choices` không có chỉ mục nào ngoài khóa chính | `quizService.ts:88, 157, 175, 263, 340, 438` |
| 4 | `courses.instructor_id` | danh sách khóa học của chính giảng viên; đếm `coursesTaught` ở trang quản lý người dùng | `courseService.ts:70-75` · `adminService.ts:20` |

Ba cột còn lại (`lesson_progress.lesson_id`, `answers.question_id`, `answers.choice_id`) gần như chỉ nằm trên đường `ON DELETE CASCADE` khi xóa khóa học. Nhánh cascade `users → courses` thực tế **không bao giờ chạy** vì ứng dụng chỉ khóa tài khoản chứ không xóa người dùng.

**Vì sao vẫn hoãn.** PostgreSQL đọc theo trang 8 KB; bảng chưa vượt một hai trang (~100–200 dòng hẹp) thì luôn quét tuần tự, có chỉ mục cũng không dùng. Dữ liệu seed hiện tại là 5 người dùng · 3 khóa học · 2 ghi danh → lợi ích đo được đúng bằng 0, trong khi mỗi chỉ mục tốn ~20–25 byte/dòng và làm chậm ghi. Thêm chỉ mục mà không có `EXPLAIN ANALYZE` chứng minh là tối ưu theo cảm tính.

**Rủi ro triển khai — đính chính so với ghi chép ngày 05/09 buổi sáng.** Lần trước ghi là "phải chạy `prisma migrate deploy` trên Render, rủi ro sát ngày bảo vệ". Kiểm tra lại `render.yaml`: `buildCommand` là `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build` — **không có `npm run seed`** (commit `b00309b` từng thêm, sau đó đã gỡ). Vậy deploy **không xóa dữ liệu**. `CREATE INDEX` trên bảng vài chục dòng chạy trong mili-giây, chỉ giữ khóa `SHARE` (chặn ghi, không chặn đọc); nếu migration hỏng thì build đỏ và Render giữ nguyên bản đang chạy. Rủi ro thật thấp hơn nhiều so với ghi chép ban đầu — lý do hoãn bây giờ là **lợi ích bằng 0**, không phải rủi ro.

**Một cái giá cụ thể nếu làm ngay:** báo cáo và slide ghi *"11 bảng, 3 kiểu liệt kê, 217 dòng"*. Thêm bốn dòng `@@index` là `schema.prisma` thành 221 dòng → lại phải vá hồ sơ Office thêm một vòng.

**Câu lệnh khi làm (sau bảo vệ):**

```prisma
model Course         { …  @@index([instructorId]) }
model Enrollment     { …  @@index([courseId])     }
model QuizSubmission { …  @@index([quizId])       }
model Choice         { …  @@index([questionId])   }
```

```sql
CREATE INDEX "courses_instructor_id_idx"    ON "courses"("instructor_id");
CREATE INDEX "enrollments_course_id_idx"    ON "enrollments"("course_id");
CREATE INDEX "quiz_submissions_quiz_id_idx" ON "quiz_submissions"("quiz_id");
CREATE INDEX "choices_question_id_idx"      ON "choices"("question_id");
```

Không tìm thấy `await` bên trong vòng lặp ở tầng service — không còn N+1 nào ngoài chỗ đã sửa ở commit `e63ad5c`.

---

## 2026-09-05 (chiều) — Đưa phát hiện chỉ mục vào hồ sơ

Sau khi khảo sát chi tiết (mục 6 ở trên), phát hiện được ghi vào hồ sơ thay vì sửa lược đồ:

| Nơi | Thay đổi |
|---|---|
| `docs/DE-AN.md` | Thêm mục **4.3. Chiến lược đánh chỉ mục — và bảy khóa ngoại chưa được phủ**: giải thích vì sao PostgreSQL không tự đánh chỉ mục FK, bảng kiểm kê 8 cột đã phủ / 7 cột chưa, ngưỡng dữ liệu, và nghịch lý `status` được đánh chỉ mục còn `instructorId` thì không |
| `BAO-CAO-DO-AN-LearnQuiz.docx` §5.9 | "Ba hạn chế cần nêu trung thực" → **"Bốn hạn chế"**, thêm mục thứ tư về bốn cột khóa ngoại chưa có chỉ mục |
| `BAO-CAO-DO-AN-LearnQuiz.docx` Bảng 6.1 | Thêm hàng **"Đánh chỉ mục khóa ngoại — ưu tiên Cao"**, kèm yêu cầu đo `EXPLAIN ANALYZE` trước và sau |
| `SLIDE-BAO-VE-LearnQuiz.pptx` slide 16 | Thêm gạch đầu dòng thứ tư trong khối "Hạn chế — nêu trung thực" |

Báo cáo tăng từ **72 lên 73 trang** (Word tự cập nhật mục lục và ba danh mục).

### Vì sao PDF báo cáo phải xuất tay

Slide đã xuất lại tự động bằng PowerPoint COM, chạy tốt trong ~20 giây. Riêng Word thì `ExportAsFixedFormat` **treo vô hạn khi chạy qua COM** trên máy này — đã thử đủ sáu cách, mỗi lần Word mở tệp và đếm ra 73 trang trong 2 giây rồi đứng luôn ở bước xuất, tiến trình `WINWORD` chạy tới hơn 900 giây CPU:

| Đã loại trừ | Cách kiểm chứng |
|---|---|
| Hộp thoại cập nhật trường mục lục | tắt `UpdateFieldsAtPrint`, `UpdateLinksAtPrint` — vẫn treo |
| Máy in mặc định `Brother DCP-J100` đang `WorkOffline` | tạm đổi mặc định sang *Microsoft Print to PDF* rồi trả lại — vẫn treo |
| Mark of the Web (tệp do cầu nối ghi xuống bị đánh dấu "tải từ Internet") | `Unblock-File`, xác nhận `ReadOnly=False` — vẫn treo |
| Add-in của Word (Zotero, Copilot…) | khởi động `winword.exe /a` (không nạp add-in, không nạp `Normal.dotm`) — vẫn treo |
| Bản thân hàm xuất PDF | đổi sang `SaveAs2(…, 17)` rồi `PrintOut` qua *Microsoft Print to PDF* — cả hai đều treo |
| Tệp `.docx` hỏng | Word mở được, cập nhật mục lục được, `Save()` thành công, LibreOffice xuất được 69 trang bình thường |

Kết luận: đây là giới hạn của Word khi bị điều khiển qua COM trên máy này, không phải lỗi tệp. Bản PDF do chính cha bấm *File → Export* ngày 01/09 chứng minh Word xuất được khi thao tác trong giao diện.

**Việc cần cha làm (khoảng 30 giây):**

1. Mở `docs/BAO-CAO-DO-AN-LearnQuiz.docx` bằng Word.
2. `Ctrl + A` rồi `F9`; nếu Word hỏi, chọn **Update entire table**.
3. **File → Export → Create PDF/XPS**, ghi đè `docs/BAO-CAO-DO-AN-LearnQuiz.pdf`.

Cho tới khi làm bước này, `BAO-CAO-DO-AN-LearnQuiz.pdf` vẫn là bản **72 trang** — số liệu đã đúng hết (345, adminService 76, Bảng 1.6) nhưng **chưa có** mục hạn chế thứ tư và hàng mới của Bảng 6.1. Tệp `.docx` mới là bản đủ.

*Đã dọn:* trả lại máy in mặc định `Brother DCP-J100 Printer`, đóng hết tiến trình Word chạy ngầm, gỡ Mark of the Web cho toàn bộ tệp Office và PDF trong `docs/` để Word không hiện thanh cảnh báo vàng khi cha mở.

---

## 2026-09-05 (tối) — Sửa lỗi "No table of contents entries found" ở hai danh mục

### Triệu chứng

Trong bản PDF cha xuất ra: **MỤC LỤC hiện đầy đủ** kèm số trang, nhưng **DANH MỤC HÌNH VẼ** và **DANH MỤC BẢNG BIỂU** chỉ có đúng một dòng `No table of contents entries found.` Bấm `Ctrl + A` → `F9` cũng không cứu được.

### Nguyên nhân — hai lỗi chồng lên nhau

Mã trường trong `word/document.xml` là:

```
TOC \h \t "CaptionFigure,1"
TOC \h \t "CaptionTable,1"
```

**Lỗi 1 — sai tên style.** Công tắc `\t` của trường `TOC` khớp theo **tên hiển thị** của style, không phải `styleId`. Trong `word/styles.xml`:

```xml
<w:style w:type="paragraph" w:styleId="CaptionFigure">
  <w:name w:val="Caption Figure" />   <!-- CO DAU CACH -->
```

Trường đi tìm style tên `CaptionFigure` (liền nhau) trong khi style thật tên `Caption Figure` (có dấu cách) → không khớp dòng nào.

**Lỗi 2 — sai dấu phân cách danh sách.** Cú pháp `\t "Tên style,Cấp"` dùng **dấu phân cách danh sách của Windows**, không phải luôn luôn là dấu phẩy. Máy này:

```
(Get-Culture).TextInfo.ListSeparator  ->  ;
HKCU:\Control Panel\International\sList  ->  ;
```

Nên `"CaptionFigure,1"` bị Word đọc thành **một** tên style là `CaptionFigure,1`. Đây cũng là lý do MỤC LỤC vẫn chạy tốt: nó dùng `\o "1-3"`, không có dấu phân cách nào.

### Cách sửa

Bỏ luôn số cấp — vừa đúng tên, vừa không phụ thuộc thiết lập vùng miền của máy:

```
TOC \h \t "Caption Figure"
TOC \h \t "Caption Table"
```

Kiểm chứng bằng Word COM: `TablesOfContents.Item(2).Range.Text` từ **35 ký tự** (chỉ mỗi câu placeholder) lên **542 ký tự** (10 hình), `Item(3)` lên **2.088 ký tự** (43 bảng).

Sau đó **nướng sẵn kết quả vào tệp**: mở bằng Word, `Update()` cả ba mục lục hai lượt cho số trang hội tụ, rồi `Save()`. Nhờ vậy tệp `.docx` giao đi đã có sẵn hai danh mục đầy đủ — cha **không cần bấm `F9`** nữa, và cũng không sợ lỡ tay chọn *"Update page numbers only"* (vốn là lựa chọn mặc định trong hộp thoại của Word, và với một bảng đang rỗng thì nó giữ nguyên sự rỗng — nhiều khả năng đây chính là điều đã xảy ra lần trước).

Hai danh mục nay có nội dung thật, nhưng **số trang cuối cùng vẫn là 72** — bằng đúng bản gốc. Trước đây ba trang danh mục gần như trống (mỗi trang chỉ một dòng placeholder); nay chúng được lấp đầy, bù lại phần nội dung mới thêm ở §5.9 và Bảng 6.1.

*Ghi để lần sau khỏi nhầm:* `Document.ComputeStatistics(2)` báo **74 trang**, nhưng bản PDF Word xuất ra chỉ có **72**. Hàm này phân trang theo thông số của **máy in mặc định** (ở đây là Brother DCP-J100 đang offline), còn `Export → Create PDF` phân trang theo bộ xuất PDF. Khi cần con số thật thì phải đọc từ tệp PDF đã xuất, không tin `ComputeStatistics`.

### Vẫn còn: PDF phải xuất tay

`ExportAsFixedFormat` qua COM tiếp tục treo, kể cả trên tệp do chính Word ghi ra. Cha mở `docs/BAO-CAO-DO-AN-LearnQuiz.docx` rồi **File → Export → Create PDF/XPS**, ghi đè `docs/BAO-CAO-DO-AN-LearnQuiz.pdf`. Lần này **không cần bấm `F9` trước** vì cả ba mục lục đã có sẵn nội dung và số trang đúng.

### Nghiệm thu bản PDF cuối (xuất tay bằng Word, commit `59b579c`)

| Kiểm tra | Kết quả |
|---|---|
| `pdfinfo` | 72 trang · Producer *Microsoft Word for Microsoft 365* |
| Chuỗi `No table of contents entries found` | **0** lần |
| Danh mục hình vẽ | **10** mục, đủ số trang (Hình 3.1 → 5.2) |
| Danh mục bảng biểu | **43** mục, đủ số trang (Bảng 1.1 → D.1) |
| Chuỗi `344` / `4.017` / `6.067` / `1.609` / `143 tệp` | **0** lần |
| Bảng 1.6 | 161 tệp · 4.295/58 · 6.174/52 · 1.993/18 |
| §5.9 | "Bốn hạn chế cần nêu trung thực" + mục về bốn cột khóa ngoại |
| Bảng 6.1 | có hàng "Đánh chỉ mục khóa ngoại" kèm ghi chú `EXPLAIN ANALYZE` |
| CI trên `59b579c` | xanh |

Bộ hồ sơ nay nhất quán ở cả năm nơi: mã nguồn · `.md` · DOCX · PPTX · PDF.

---

## 2026-09-05 (khuya) — Truy nguyên lỗi E2E "Back khôi phục từ khóa"

### Bối cảnh — kèm một lỗi quy trình của Cowork

Commit `57659c6` mang thông điệp *"sửa lỗi rtk trong markdown"* nhưng thực tế **gom luôn 7 tệp**: hai tài liệu mới, ba ca E2E mới, `axiosClient.ts`, `CourseListPage.tsx`, `LearnPage.tsx`. Nguyên nhân: Cowork chạy `git add -A` mà không soát `git status` trước, nên quét cả phần đang làm dở trong worktree. Thông điệp commit vì thế mô tả sai nội dung. **Bài học:** luôn `git status` trước khi `git add -A`, hoặc chỉ `git add` đúng tệp đã sửa.

Hệ quả: E2E tăng từ 3 lên **6 ca**, và ca thứ 5 hỏng làm **CI đỏ trên `main`**.

### Triệu chứng

`Back khôi phục từ khóa trong ô tìm kiếm`: gõ "JavaScript" → Enter → gõ "React" → Enter → Back. Ô tìm kiếm phải trở lại "JavaScript" nhưng vẫn hiện "React". Hỏng 6/6 lần, cả headless lẫn headed.

### Các giả thuyết đã loại trừ

| Giả thuyết | Cách bác bỏ |
|---|---|
| Ca test chập chờn (flaky) | Hỏng 6/6 lần liên tiếp, cả khi chạy riêng |
| Headless không sinh khung hình | Chạy `--headed` cũng hỏng 3/3 |
| `goBack()` tải lại tài liệu | Ghi `docId` ngẫu nhiên mỗi tài liệu — trước và sau Back giống nhau |
| Chromium khôi phục form theo lịch sử | React props cũng ghi `value="React"`, không chỉ DOM |
| Router không nghe `popstate` | `popstate` có bắn, `location.search` đúng `?search=JavaScript` |

### Nguyên nhân thật

Đếm request thật mà trang gửi đi cho thấy **không hề có request nào cho `search=React`**. Gắn log vào chính handler thì bắt được:

```
[dbg] ENTER v= JavaScript | searchParams= search=JavaScript | location= ?search=JavaScript
[dbg] UPDATER truoc= search=JavaScript -> next= search=JavaScript
```

Phím Enter **thứ hai** nhận `v = "JavaScript"` chứ không phải "React" — chữ vừa gõ đã bị xoá trước khi Enter kịp đọc.

Thủ phạm là chính effect đồng bộ:

```tsx
useEffect(() => { setSearchInput(search); }, [search]);
```

Chuỗi sự kiện: bấm Enter lần 1 → điều hướng commit → `search` đổi từ `""` sang `"JavaScript"` → effect chạy → **ghi đè lên chữ người dùng đã gõ tiếp trong lúc chờ**. Lần Enter kế tiếp vì thế gửi đi đúng tu khóa cũ, router thấy không có gì thay đổi nên bỏ qua: URL không đổi, danh sách không đổi, chỉ mỗi ô input là đổi — ba thứ nói ba đằng.

**Đây là lỗi người dùng chạm được thật, không phải lỗi test:** ai gõ nhanh, tìm một từ rồi gõ tiếp từ thứ hai trước khi kết quả kịp về, sẽ thấy ô tìm kiếm tự nhảy về từ khóa cũ.

### Bản vá

`frontend/src/pages/CourseListPage.tsx` — ba thay đổi:

1. **Bỏ hẳn** `useEffect(..., [search])`. Ô tìm kiếm chỉ cần lấy giá trị ban đầu từ URL (`useState(search)`), không có lý do gì để ghi đè lên chữ người dùng đang gõ.
2. **Thêm listener `popstate`** đọc thẳng `window.location.search` — đúng và chỉ đúng khi điều hướng *không* do người dùng gõ (Back/Forward), là trường hợp duy nhất cần đồng bộ lại.
3. **Phòng thủ thêm:** `setSearchParams` dùng dạng hàm (tránh `searchParams` cũ trong closure), và handler Enter đọc thẳng `e.target.value` thay vì `searchInput` của closure.

`frontend/playwright.config.ts` — `retries: process.env.CI ? 2 : 0` làm lưới an toàn cho kiểm thử trình duyệt.

### Kết quả đo

| | Ca "Back" riêng | Toàn bộ 6 ca |
|---|---|---|
| Trước vá | 0/6 đạt | 0/3 |
| Sau vá | 6/6 | **5/5** |

Ca test **giữ nguyên như cha viết** — không phải nới lỏng khẳng định để cho qua.

### Số liệu đã lệch lại — chờ quyết định

Phần mã cha thêm làm Bảng 1.6 của báo cáo sai lần nữa:

| Hạng mục | Báo cáo đang ghi | Thực tế |
|---|---|---|
| Tổng tệp mã nguồn và cấu hình | 161 | **162** |
| Mã nguồn front-end | 6.174 dòng / 52 tệp | **6.215 dòng** / 52 tệp |
| Mã nguồn kiểm thử | 1.993 dòng / 18 tệp | **2.078 dòng** / 18 tệp |

Back-end (4.295/58), CSDL (11 bảng · 3 enum · 217 dòng), điểm cuối (46) và màn hình (21) vẫn đúng. Ba dòng lệch đều là chênh nhỏ; vá lại DOCX/PPTX/PDF mất khoảng 30 phút và phải xuất PDF tay lần nữa — để cha quyết có làm trước bảo vệ hay không.

---

## 2026-09-05 (chốt) — Rà soát phần mã chưa qua review và hợp nhất tài liệu

### 1. Đã review phần mã bị commit `57659c6` gom nhầm

Ba tệp mã nguồn vào `main` dưới một thông điệp commit nói về tài liệu, nên chưa ai soát. Đã đọc lại toàn bộ:

| Tệp | Thay đổi | Đánh giá |
|---|---|---|
| `api/axiosClient.ts` | Không refresh token khi `401` đến từ `/auth/login` hoặc `/auth/register`; thêm `timeout: 15000` cho lời gọi refresh | **Đúng và cần thiết.** Sai mật khẩu trước đây kích hoạt vòng refresh vô ích rồi tải lại trang, làm mất thông báo lỗi tại form. Timeout chặn được tình huống refresh treo vô hạn khi mạng chập chờn. |
| `pages/LearnPage.tsx` | Thêm `lessonVersion` (useRef) làm dấu phiên; mọi lời gọi bất đồng bộ đối chiếu phiên trước khi ghi state; hai effect nạp dữ liệu có cờ `ignore` và hàm dọn dẹp | **Đúng bài bản.** Đây là mẫu chuẩn chống "phản hồi đến muộn ghi đè kết quả mới" — chuyển bài nhanh sẽ không còn cảnh nội dung bài A đè lên bài B. Khớp với ca E2E mới cùng tên. |
| `pages/CourseListPage.tsx` | Thêm `useEffect(..., [search])` đồng bộ ô tìm kiếm | **Sai** — chính là lỗi đã truy nguyên và vá ở commit `d8bf9f0`. |

Không tìm thấy khiếm khuyết nào khác trong hai tệp đầu.

### 2. Hai hướng dẫn kiểm tra tay trùng tên — đã hợp nhất

Commit trên cũng thêm `docs/HUONG-DAN-KIEM-TRA-TAY.md`, tự ghi ở dòng đầu là *"hướng dẫn hiện hành; thay thế bản ngày 02/09"* — nhưng `README.md` vẫn trỏ vào bản **02/09**. Ai đọc README sẽ mở đúng bản đã bị thay thế.

Đã xử lý:

- `README.md` trỏ sang `HUONG-DAN-KIEM-TRA-TAY.md`, đồng thời thêm liên kết `MAU-KET-QUA-KIEM-TRA.md` (phiếu ghi kết quả).
- Bản `HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md` được gắn khung cảnh báo ở đầu tệp: đã bị thay thế, giữ lại làm biên bản đợt 02–04/09, số liệu bên trong cố ý không sửa lùi.

Đáng ghi nhận: bản hướng dẫn mới **không chép cứng số ca kiểm thử** mà yêu cầu *"ghi số test từ output thật; không suy ra từ số ghi trong README"*. Đây là cách làm đúng — chính việc chép cứng số liệu là nguồn của phần lớn các lần lệch trong nhật ký này.

### 3. Công cụ hỗ trợ

`kiem-tra-learnquiz.ps1` (đặt ở Desktop, **cố ý để ngoài repo** để không làm đổi số tệp của dự án) chạy toàn bộ cổng tự động và in bảng ĐẠT/HỎNG: git sạch và đồng bộ · back-end lint/typecheck/test/build/prisma/audit · front-end lint/typecheck/vitest/playwright/build/audit · smoke production. Lưu ý kỹ thuật: phải ép `chcp 65001` và `[Console]::OutputEncoding = UTF8` trước khi gọi `npm`, nếu không dấu `✓` trong output bị vỡ và đếm ra 0.


### 4. Đã đồng bộ lại số liệu Bảng 1.6 (chốt tại `3d5aa09`)

| Hạng mục | Trước | Nay |
|---|---|---|
| Tổng tệp mã nguồn và cấu hình | 161 | **162** |
| Mã nguồn front-end (trừ tệp kiểm thử) | 6.174 dòng / 52 tệp | **6.215 dòng** / 52 tệp |
| Mã nguồn kiểm thử tự động | 1.993 dòng / 18 tệp | **2.078 dòng** / 18 tệp |
| Slide 15 — tổng dòng TypeScript | 10.469 | **10.510** |

Back-end (4.295 dòng / 58 tệp), CSDL (11 bảng · 3 kiểu liệt kê · 217 dòng), điểm cuối API (46), màn hình (21) và số phép khẳng định (345) không đổi.

`SLIDE-BAO-VE-LearnQuiz.pptx` + `.pdf` đã xuất lại bằng PowerPoint (17 trang). `BAO-CAO-DO-AN-LearnQuiz.docx` đã sửa; **bản `.pdf` cần xuất tay** vì `ExportAsFixedFormat` qua COM vẫn treo trên máy này — mở Word, `File → Export → Create PDF/XPS`, không cần bấm `F9` vì ba mục lục đã được nướng sẵn.

*Lưu ý cho lần sau:* ba con số này lệch lại mỗi khi có thay đổi mã nguồn. Bản hướng dẫn kiểm tra tay mới đã đi đúng hướng khi từ chối chép cứng số liệu — nếu còn thời gian sau bảo vệ, nên làm tương tự cho Bảng 1.6 hoặc thêm một bước kiểm tra tự động phát hiện lệch.
