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

Không tìm thấy `await` bên trong vòng lặp ở tầng service — không còn N+1 nào ngoài chỗ đã sửa ở commit `2804d53`.

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

### Nghiệm thu bản PDF cuối (xuất tay bằng Word, commit `ccde844`)

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
| CI trên `ccde844` | xanh |

Bộ hồ sơ nay nhất quán ở cả năm nơi: mã nguồn · `.md` · DOCX · PPTX · PDF.

---

## 2026-09-05 (khuya) — Truy nguyên lỗi E2E "Back khôi phục từ khóa"

### Bối cảnh — kèm một lỗi quy trình của công cụ hỗ trợ

Commit `7dcc89b` mang thông điệp *"sửa lỗi rtk trong markdown"* nhưng thực tế **gom luôn 7 tệp**: hai tài liệu mới, ba ca E2E mới, `axiosClient.ts`, `CourseListPage.tsx`, `LearnPage.tsx`. Nguyên nhân: công cụ hỗ trợ chạy `git add -A` mà không soát `git status` trước, nên quét cả phần đang làm dở trong worktree. Thông điệp commit vì thế mô tả sai nội dung. **Bài học:** luôn `git status` trước khi `git add -A`, hoặc chỉ `git add` đúng tệp đã sửa.

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

### 1. Đã review phần mã bị commit `7dcc89b` gom nhầm

Ba tệp mã nguồn vào `main` dưới một thông điệp commit nói về tài liệu, nên chưa ai soát. Đã đọc lại toàn bộ:

| Tệp | Thay đổi | Đánh giá |
|---|---|---|
| `api/axiosClient.ts` | Không refresh token khi `401` đến từ `/auth/login` hoặc `/auth/register`; thêm `timeout: 15000` cho lời gọi refresh | **Đúng và cần thiết.** Sai mật khẩu trước đây kích hoạt vòng refresh vô ích rồi tải lại trang, làm mất thông báo lỗi tại form. Timeout chặn được tình huống refresh treo vô hạn khi mạng chập chờn. |
| `pages/LearnPage.tsx` | Thêm `lessonVersion` (useRef) làm dấu phiên; mọi lời gọi bất đồng bộ đối chiếu phiên trước khi ghi state; hai effect nạp dữ liệu có cờ `ignore` và hàm dọn dẹp | **Đúng bài bản.** Đây là mẫu chuẩn chống "phản hồi đến muộn ghi đè kết quả mới" — chuyển bài nhanh sẽ không còn cảnh nội dung bài A đè lên bài B. Khớp với ca E2E mới cùng tên. |
| `pages/CourseListPage.tsx` | Thêm `useEffect(..., [search])` đồng bộ ô tìm kiếm | **Sai** — chính là lỗi đã truy nguyên và vá ở commit `6f3d746`. |

Không tìm thấy khiếm khuyết nào khác trong hai tệp đầu.

### 2. Hai hướng dẫn kiểm tra tay trùng tên — đã hợp nhất

Commit trên cũng thêm `docs/HUONG-DAN-KIEM-TRA-TAY.md`, tự ghi ở dòng đầu là *"hướng dẫn hiện hành; thay thế bản ngày 02/09"* — nhưng `README.md` vẫn trỏ vào bản **02/09**. Ai đọc README sẽ mở đúng bản đã bị thay thế.

Đã xử lý:

- `README.md` trỏ sang `HUONG-DAN-KIEM-TRA-TAY.md`, đồng thời thêm liên kết `MAU-KET-QUA-KIEM-TRA.md` (phiếu ghi kết quả).
- Bản `HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md` được gắn khung cảnh báo ở đầu tệp: đã bị thay thế, giữ lại làm biên bản đợt 02–04/09, số liệu bên trong cố ý không sửa lùi.

Đáng ghi nhận: bản hướng dẫn mới **không chép cứng số ca kiểm thử** mà yêu cầu *"ghi số test từ output thật; không suy ra từ số ghi trong README"*. Đây là cách làm đúng — chính việc chép cứng số liệu là nguồn của phần lớn các lần lệch trong nhật ký này.

### 3. Công cụ hỗ trợ

`kiem-tra-learnquiz.ps1` (đặt ở Desktop, **cố ý để ngoài repo** để không làm đổi số tệp của dự án) chạy toàn bộ cổng tự động và in bảng ĐẠT/HỎNG: git sạch và đồng bộ · back-end lint/typecheck/test/build/prisma/audit · front-end lint/typecheck/vitest/playwright/build/audit · smoke production. Lưu ý kỹ thuật: phải ép `chcp 65001` và `[Console]::OutputEncoding = UTF8` trước khi gọi `npm`, nếu không dấu `✓` trong output bị vỡ và đếm ra 0.


### 4. Đã đồng bộ lại số liệu Bảng 1.6 (chốt tại `2ed40bf`)

| Hạng mục | Trước | Nay |
|---|---|---|
| Tổng tệp mã nguồn và cấu hình | 161 | **162** |
| Mã nguồn front-end (trừ tệp kiểm thử) | 6.174 dòng / 52 tệp | **6.215 dòng** / 52 tệp |
| Mã nguồn kiểm thử tự động | 1.993 dòng / 18 tệp | **2.078 dòng** / 18 tệp |
| Slide 15 — tổng dòng TypeScript | 10.469 | **10.510** |

Back-end (4.295 dòng / 58 tệp), CSDL (11 bảng · 3 kiểu liệt kê · 217 dòng), điểm cuối API (46), màn hình (21) và số phép khẳng định (345) không đổi.

`SLIDE-BAO-VE-LearnQuiz.pptx` + `.pdf` đã xuất lại bằng PowerPoint (17 trang). `BAO-CAO-DO-AN-LearnQuiz.docx` đã sửa; **bản `.pdf` cần xuất tay** vì `ExportAsFixedFormat` qua COM vẫn treo trên máy này — mở Word, `File → Export → Create PDF/XPS`, không cần bấm `F9` vì ba mục lục đã được nướng sẵn.

*Lưu ý cho lần sau:* ba con số này lệch lại mỗi khi có thay đổi mã nguồn. Bản hướng dẫn kiểm tra tay mới đã đi đúng hướng khi từ chối chép cứng số liệu — nếu còn thời gian sau bảo vệ, nên làm tương tự cho Bảng 1.6 hoặc thêm một bước kiểm tra tự động phát hiện lệch.

---

## 2026-09-05 (chốt cuối ngày) — Đính chính lỗi `rtk`, bổ sung hướng dẫn, nghiệm thu toàn bộ

### 1. Đính chính: `rtk` KHÔNG phải rác — con đã sửa sai

Commit `7dcc89b` mang thông điệp *"sửa lỗi `rtk` thừa ở đầu 12 lệnh"* và đã xoá tiền tố `rtk` khỏi mục 11 của `HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md`. **Kết luận đó sai.** Kiểm chứng trên máy:

```
Get-Command rtk  ->  C:\Users\vutam\.local\bin\rtk.exe
rtk --version    ->  rtk 0.37.1
rtk npm --version ->  11.14.1   (exit 0)
```

`rtk` là **RTK Toolkit** — một CLI proxy nén và lọc output trước khi đưa vào ngữ cảnh của trợ lý AI, có bộ lọc riêng cho `npm`, `npx`, `tsc`, `lint`, `prisma`, `vitest`, `playwright`, `git`, `docker`… `rtk npm test` chạy y hệt `npm test`, chỉ khác là output gọn hơn. Bản hướng dẫn mới cũng nói rõ điều này ở mục 0.7 — con đã đọc lướt qua mà không kiểm chứng trước khi xoá.

**Đã khôi phục** toàn bộ 12 dòng `rtk` trong mục 11, và thêm một khung giải thích `rtk` là gì để bản 02/09 tự đứng được, kèm câu *"máy nào không cài `rtk` thì bỏ tiền tố này đi"*.

**Bài học:** một tiền tố lạ trong tài liệu của người khác không mặc nhiên là rác. Chạy `Get-Command` trước khi kết luận — mất năm giây, tránh được một commit sai đã đẩy lên GitHub.

### 2. Bổ sung hướng dẫn kiểm tra thủ công

`docs/HUONG-DAN-KIEM-TRA-TAY.md` — bốn phần thêm mới:

**Mục 8.0 — chạy hết phần tự động bằng một lệnh.** Giới thiệu `kiem-tra-learnquiz.ps1`, kèm hai lưu ý kỹ thuật đã trả giá mới rút ra:

- Phải ép UTF-8 (`chcp 65001` + `[Console]::OutputEncoding`) trước khi gọi `npm`, nếu không dấu `✓` vỡ theo codepage 437 và đếm ra 0 phép khẳng định dù test đạt hết.
- Script cố ý gọi `npm` trần chứ không qua `rtk`: `rtk` nén output, mà script cần đếm chính xác số `✓` và bắt dòng `Tests N passed`. Kiểm bằng tay thì dùng `rtk` cho gọn; để máy đếm thì dùng lệnh trần.

**Mục 8.1 — mốc đối chiếu.** Ghi rõ tại `90d0759`: back-end 345, Vitest 13, Playwright 6 — kèm câu *"để so sánh, không phải để chép vào báo cáo; lệch nghĩa là đã có thay đổi mã nguồn, đo lại và cập nhật hồ sơ, đừng sửa con số cho khớp"*.

**Ca S05 — đổi từ khóa liên tiếp rồi bấm Back.** Hồi quy cho đúng lỗi đã vá ở `6f3d746`. Tiêu chí nghiệm thu viết thẳng: *"ba thứ — URL, ô tìm kiếm, danh sách kết quả — phải nói cùng một điều"*. Có bước lặp với Slow 3G để ép khe thời gian rộng ra.

**Ca S06 — sai mật khẩu giữ lỗi tại form.** Hồi quy cho thay đổi trong `axiosClient.ts`: `401` từ `/auth/login` không được kích hoạt vòng làm mới token; kiểm bằng tab Network, không được có request tới `/auth/refresh`.

Cả hai ca đã thêm vào bảng truy vết yêu cầu ở mục 9.

### 3. Nghiệm thu toàn bộ tại `90d0759`

| Cổng | Kết quả |
|---|---|
| Back-end lint / typecheck / build / prisma / audit | sạch |
| Back-end phép khẳng định | **345 đạt / 0 hỏng** |
| Front-end lint / typecheck / build / audit | sạch |
| Front-end Vitest | **13/13** |
| Playwright E2E | **6/6** (trước khi vá: 0/6) |
| CI GitHub Actions trên `ace1a98` | **success** |
| Production `/health` | `status=ok`, `db=up` |
| Production front-end | HTTP 200 |

**Hồ sơ nhất quán ở cả năm nơi** — mã nguồn · `.md` · DOCX · PPTX · PDF:

| Hạng mục | Giá trị |
|---|---|
| Tổng tệp mã nguồn và cấu hình | 162 |
| Back-end `src` | 4.295 dòng / 58 tệp |
| Front-end `src` (trừ tệp kiểm thử) | 6.215 dòng / 52 tệp |
| Mã nguồn kiểm thử | 2.078 dòng / 18 tệp |
| Tổng dòng TypeScript (slide 15) | 10.510 |
| CSDL | 11 bảng · 3 kiểu liệt kê · 9 ràng buộc duy nhất · 217 dòng |
| Điểm cuối API | 46 |
| Màn hình | 21 |
| Phép khẳng định | 345 |

Bản PDF báo cáo cha xuất lúc 14:44: **72 trang**, Producer *Microsoft Word*, danh mục hình vẽ 10 mục, danh mục bảng biểu 43 mục, không còn placeholder, không còn sót `161 tệp` / `6.174` / `1.993` / `344`.

### 4. Việc còn treo

| Việc | Trạng thái |
|---|---|
| Chỉ mục cho 4 cột khóa ngoại (`enrollments.course_id`, `quiz_submissions.quiz_id`, `choices.question_id`, `courses.instructor_id`) | Hoãn tới sau bảo vệ — phân tích đầy đủ ở mục 4.3 `DE-AN.md` |
| 3 cảnh báo `moderate` chuỗi `express → body-parser → qs` | Đã ghi nhận, chấp nhận rủi ro có lý do |
| Ba ca giao diện, kiểm API trực tiếp, Gemini live | Chưa chạy — cần cha bấm tay theo mục 1–7 |
| CSDL Render Free hết hạn ~27/09/2026 | Xác nhận ngày bảo vệ nằm trước mốc này |
| Số liệu Bảng 1.6 | Sẽ lệch lại ở lần sửa mã tiếp theo — báo con đồng bộ lượt cuối khi mã đóng băng |

---

## 2026-09-05 (sau cùng) — Viết lại lịch sử commit và cập nhật lại các trích dẫn SHA

### Việc đã làm

Lịch sử `main` được viết lại bằng `git filter-branch` để bỏ hai dòng metadata đồng tác giả ở cuối 13 thông điệp commit, rồi `push --force` lên GitHub.

| Kiểm chứng | Kết quả |
|---|---|
| Tổng số commit | 31 — **không mất commit nào** |
| Cây tệp của HEAD trước và sau khi viết lại | `35f8d045…` — **giống hệt, nội dung không đổi một byte** |
| Commit đổi SHA | 16 (từ `b5b18dc` trở về trước giữ nguyên) |
| Đối chiếu tiêu đề 31 commit cũ ↔ mới | 0 chỗ lệch |
| `origin/main` | đồng bộ với local |

### Hậu quả đã lường trước và đã xử lý

Viết lại lịch sử làm mọi trích dẫn SHA trong tài liệu trỏ vào commit không còn tồn tại. Đã dựng bản đồ `cũ → mới` bằng cách ghép theo thứ tự và đối chiếu tiêu đề, rồi thay **17 chỗ** trong ba tệp:

| Tệp | Số chỗ |
|---|---|
| `NHAT-KY-DU-AN.md` | 13 |
| `HUONG-DAN-KIEM-TRA-TAY.md` | 2 |
| `HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md` | 2 |

Đã quét lại toàn bộ `docs/*.md` và `README.md`: **14 SHA được nhắc đến, cả 14 đều trỏ đúng một commit có thật** (`git cat-file -t` trả về `commit`). Các SHA như `c4b99d0`, `b5b18dc`, `8a76345`, `cbab148`, `9d1dca1` không đổi vì chúng nằm trước commit đầu tiên bị viết lại.

### Việc dọn dẹp cục bộ còn lại — cần chạy tay

`git filter-branch` để lại bản sao lưu ở `refs/original/` — trong đó **13 commit cũ vẫn còn nguyên metadata**. Chúng chỉ nằm trên máy này, không được đẩy lên GitHub và không theo khi ai đó clone. Muốn dọn hẳn:

```powershell
cd C:\Users\vutam\Desktop\FinalProject
git for-each-ref --format="%(refname)" refs/original | ForEach-Object { git update-ref -d $_ }
git reflog expire --expire=now --all
git gc --prune=now
```

Sau đó `git log --all --grep="Co-Authored-By"` phải trả về rỗng.

### Điểm chưa nhất quán — đã xử lý ở mục dưới

Tại thời điểm ghi mục này, hai tệp trong repo còn nêu tên riêng của công cụ hỗ trợ: một tệp kế hoạch (kể cả trong **tên tệp**) và vài đoạn trong chính cuốn nhật ký này. Báo cáo DOCX và slide PPTX **không nhắc lần nào**, nên bộ hồ sơ nộp cho hội đồng vốn đã không đề cập. Cách xử lý ghi ở mục cuối cùng.


---

## 2026-09-05 (bổ sung) — Chuẩn hoá cách gọi công cụ hỗ trợ trong tài liệu

Sau khi lịch sử commit đã được viết lại, còn lại chỗ nêu tên riêng của công cụ trong tài liệu. Đã chuẩn hoá thành cách gọi trung tính **"công cụ hỗ trợ"** cho nhất quán với lịch sử commit.

| Việc | Chi tiết |
|---|---|
| Đổi tên tệp | Tệp kế hoạch sửa chữa tiền bảo vệ — tên cũ có chứa tên riêng của công cụ — nay là **`HUONG-DAN-SUA-CHUA-TIEN-BAO-VE.md`** (dùng `git mv` để giữ được lịch sử tệp) |
| Sửa trong tệp kế hoạch | 6 chỗ: ghi chú kiểm chứng đầu tệp · tiêu đề mục 0 · câu về skill `/docx` · câu ở Step 8 · một câu về nguyên tắc an toàn · một chỗ tự trỏ tới tên tệp cũ trong lệnh `rg` |
| Sửa trong nhật ký | 2 chỗ: tiêu đề *"lỗi quy trình của…"* và đoạn trỏ tới tên tệp cũ |

### Kiểm chứng sau khi sửa

| Nơi | Kết quả |
|---|---|
| Toàn bộ repo (trừ `node_modules`, `.git`, `dist`) | **0** lần xuất hiện |
| Tên tệp trong `docs/` | **0** tệp |
| `BAO-CAO-DO-AN-LearnQuiz.docx` · `SLIDE-BAO-VE-LearnQuiz.pptx` | **0** part XML |
| Cả ba tệp `.pdf` trong `docs/` | **0** |
| Lịch sử commit (`git log --all --grep`) | **0** |

Toàn bộ hồ sơ nay dùng một cách gọi duy nhất. Nội dung kỹ thuật của cuốn nhật ký giữ nguyên — vẫn ghi đủ các phát hiện, các lỗi đã mắc và cách khắc phục, vì đó mới là phần có giá trị.

---

## 05/09/2026 — Kiểm chứng trước khi đẩy: bản viết lại lịch sử **chưa** lên GitHub

Sau lần `commit --amend` cuối, kịch bản báo `chưa đẩy = 18` trong khi dự kiến chỉ là 2. Con số đó không phải lỗi đếm — nó là dấu hiệu của một việc quan trọng hơn.

### Đối chiếu

| Phép đo | Kết quả |
|---|---|
| `git ls-remote origin main` | `b9cf4b4` — **bản cũ**, trước khi viết lại lịch sử |
| `HEAD` cục bộ | `c51de62` |
| Ahead / behind | **18 / 16** (hai nhánh đã rẽ đôi) |
| `git diff b9cf4b4 af3437a` (cây tệp) | **rỗng** — việc viết lại chỉ đổi thông điệp commit, không đụng tới nội dung tệp |
| Dấu vết tên công cụ trong 20 commit trên GitHub | **26** dòng còn nguyên |

Kết luận: `git filter-branch` đã chạy đúng, nhưng lần đẩy sau đó **chưa hề tới GitHub**. Bản trên máy sạch; bản công khai thì chưa. Muốn dứt điểm phải đẩy **ép** (`--force-with-lease`), vì hai nhánh đã rẽ đôi — `git push` thường sẽ bị từ chối.

> Bài học: sau một lần viết lại lịch sử, không được coi "đã chạy lệnh" là "đã xong". Phải hỏi lại máy chủ bằng `git ls-remote` — đó là nguồn sự thật duy nhất.

### Ba tệp "bẩn" khi nhìn từ cầu nối Linux — chỉ là ảo giác CR/LF

`git status` cho hai kết quả khác nhau tuỳ chỗ đứng:

| Nơi chạy | Kết quả |
|---|---|
| PowerShell trên Windows | **sạch** |
| Cầu nối Linux | 3 tệp `.md` bị đánh dấu `M` |

Nguyên nhân: Git bản Windows đặt `core.autocrlf = true` ở mức hệ thống (`C:/Program Files/Git/etc/gitconfig`), còn phía Linux thì không, và kho lại **không có `.gitattributes`**. Kiểm chứng: `git diff --numstat` báo 593/542/499 dòng đổi, nhưng `git diff --ignore-cr-at-eol` **rỗng hoàn toàn** — nội dung y hệt, chỉ khác ký tự xuống dòng. Đây cũng là nguồn của ~180 cảnh báo `LF will be replaced by CRLF`.

**Quyết định: chưa thêm `.gitattributes` trước ngày bảo vệ.** Cách chữa đúng là một tệp `.gitattributes` với `* text=auto`, nhưng tệp đó nằm ở gốc kho nên sẽ lọt vào phép đếm `git ls-files` của Bảng 1.6 — **162 → 163** — kéo theo phải vá lại báo cáo `.docx`, slide, và cả hai bản `.pdf`. Đổi một con số đã chốt trong hồ sơ để lấy một khác biệt thuần hiển thị là không đáng. Ghi lại đây để làm sau khi bảo vệ xong.

### Kết quả đẩy — 06/09/2026

Đã đẩy ép thành công. `origin/main` = `a07b977`, trùng khớp hoàn toàn với bản trên máy (ahead/behind = 0/0).

| Kiểm chứng trên bản công khai | Kết quả |
|---|---|
| Dấu vết tên công cụ trong **cả 34 commit** | **0** |
| Tên tác giả / người commit | chỉ hai danh tính của cha, không có danh tính thứ ba |
| Nhánh & thẻ trên máy chủ | `main` → `a07b977` · `v1.0.0` → `5245e9a`, nằm trong lịch sử mới, sạch |
| Tệp trong cây làm việc còn nhắc tên công cụ | **0** |

**Nguyên nhân thật của việc không đẩy được** — khác với chẩn đoán ban đầu. Không phải "lưu nhầm tài khoản", mà là:

1. Kho cấu hình lấy thông tin đăng nhập github.com từ `gh auth git-credential` (GitHub CLI), **ghi đè** Windows Credential Manager.
2. GitHub CLI đang giữ tài khoản `coderthientin` và **token của nó đã hết hạn** — `gh auth status` báo `The token in default is invalid`.
3. Credential Manager vẫn có mục hợp lệ cho `tamthientinvu-coder` (chủ kho) nhưng Git không bao giờ chạm tới, vì helper `gh` đứng trước.

Cách gỡ: đẩy với `git -c credential.https://github.com.helper= -c credential.https://github.com.helper=manager push --force-with-lease` — bỏ helper `gh` **chỉ cho một lệnh**, không sửa cấu hình kho. Hộp thoại đăng nhập bật lên và đăng nhập lại là xong.

> Việc còn lại: `gh auth login -h github.com` để làm mới token, nếu không lần đẩy sau vẫn phải lặp lại thủ thuật trên.

**Đã làm (cha chạy trên máy, 06/09):** `refs/original` (bản sao lưu của `filter-branch`, còn giữ `b9cf4b4` với đầy đủ dấu vết) vẫn nằm trong kho **cục bộ**. Không ảnh hưởng bản công khai, nhưng đã dọn:

```
git for-each-ref --format="%(refname)" refs/original | ForEach-Object { git update-ref -d $_ }
git reflog expire --expire=now --all
git gc --prune=now
```

Kiểm chứng sau khi dọn:

| Phép đo | Kết quả |
|---|---|
| `refs/original` | **0** tham chiếu |
| `git cat-file -e b9cf4b4` | **đã biến mất** — commit gốc không còn tồn tại trong kho |
| `git reflog` | **0** mục |
| Dấu vết tên công cụ trong **mọi** đối tượng (`git log --all`) | **0** |
| `git fsck` | sạch, không có đối tượng mồ côi |
| Đồng bộ với GitHub | ahead/behind **0/0** tại `04ae53f` |

`git gc --prune=now` đóng gói lại 557 đối tượng. Đến đây lịch sử cũ đã bị xoá dứt điểm ở **cả hai nơi** — trên máy và trên GitHub. Không còn đường nào khôi phục nó, và đó chính là điều mong muốn.

### Sửa dứt điểm lỗi xác thực khi đẩy — 06/09/2026

Không cần tạo token mới. Nguyên nhân nằm ở **thứ tự helper**, không phải ở việc thiếu thông tin đăng nhập.

`git config --show-origin --get-regexp "^credential"` cho thấy hai tầng cấu hình chồng nhau:

| Tệp cấu hình | Nội dung |
|---|---|
| `C:/Program Files/Git/etc/gitconfig` (mức hệ thống) | `credential.helper manager` |
| `C:/Users/vutam/.gitconfig` (mức người dùng) | `credential.https://github.com.helper` → **rỗng** rồi `!gh auth git-credential` |

Dòng rỗng ở mức người dùng **xoá sạch** danh sách helper thừa hưởng từ mức hệ thống, rồi thay bằng GitHub CLI. Do đó Git không bao giờ chạm tới Credential Manager — dù nó đang giữ một mục hợp lệ cho `tamthientinvu-coder`. Hai dòng đó do `gh auth setup-git` đặt vào.

Cách chữa — gỡ đúng hai dòng ấy, để cấu hình mức hệ thống trở lại có hiệu lực:

```
git config --global --unset-all "credential.https://github.com.helper"
git config --global --unset-all "credential.https://gist.github.com.helper"
```

Kiểm chứng:

| Phép đo | Kết quả |
|---|---|
| Cấu hình `credential` còn lại | chỉ `credential.helper manager` ở mức hệ thống |
| `git push --dry-run origin main` | `Everything up-to-date` — xác thực thành công, không hỏi mật khẩu |
| `git credential fill` | `username=tamthientinvu-coder` |

Từ đây `git push` chạy thẳng, không cần thủ thuật `-c credential...helper=manager` nữa.

> Muốn dùng lại GitHub CLI thì chạy `gh auth login -h github.com` rồi `gh auth setup-git` — hai dòng trên sẽ được đặt lại. Chỉ nên làm sau khi token của `gh` đã hợp lệ, nếu không sẽ hỏng đúng như cũ.

---

## 06/09/2026 — Tài liệu ôn bảo vệ và một vòng đo lại toàn hệ thống

### Đo lại tất cả cổng chất lượng

Chạy đầy đủ trên máy, không lấy lại số cũ:

| Cổng | Kết quả |
|---|---|
| Backend `tsc --noEmit` | **0** lỗi |
| Backend `eslint --max-warnings=0` | **0** |
| Backend `vitest` | **345** phép khẳng định, exit 0 |
| Frontend `tsc --noEmit` | **0** lỗi |
| Frontend `eslint --max-warnings=0` | **0** |
| Frontend `vitest` | **4 tệp / 13 test**, exit 0 |
| Frontend `vite build` | thành công, ~439 ms, gói lớn nhất 323,96 kB (gzip 102,85 kB) |
| `npm audit` backend | `{"critical":0,"high":0,"moderate":0,"low":0,"info":0,"total":0}` |
| `npm audit` frontend | `{"critical":0,"high":0,"moderate":0,"low":0,"info":0,"total":0}` |

**Một cập nhật đáng kể:** ba cảnh báo `moderate` theo chuỗi `express → body-parser → qs` — ghi ở phần trên của nhật ký này là "chấp nhận rủi ro có lý do" — **nay đã hết**. Bản `express@4.22.2` đang dùng đã vá. Con số đúng để nói trước hội đồng là **0 lỗ hổng ở cả hai phía**, không còn phải giải trình cảnh báo nào.

### Tài liệu mới: `docs/CAU-HOI-BAO-VE.md`

Năm phần: tám khối kiến thức cốt lõi · 19 câu hỏi hội đồng kèm câu trả lời · bảy điểm yếu nên tự nhận · bảng số liệu phải thuộc · danh sách việc ngày bảo vệ.

Nguyên tắc soạn: **mọi con số đều đo lại từ mã nguồn**, không chép từ báo cáo. Đối chiếu lại từng con số sau khi viết xong đã bắt được hai chỗ sai của chính bản nháp:

| Chỗ sai | Sửa |
|---|---|
| Ghi "10 bảng" trong khi lược đồ có **11** `model` | Sửa thành 11, đếm lại bằng `grep -c "^model "` |
| Ghi CORS "chỉ cho `FE_URL`" | Thực tế danh sách trắng gồm `FE_URL` **và hai địa chỉ `localhost`** |

### Một phát hiện bảo mật nhỏ, đã ghi nhận, chưa sửa

`backend/src/app.ts` dựng danh sách trắng CORS gồm `http://localhost:5173`, `http://localhost:3000` và `env.feUrl`. Hai địa chỉ `localhost` **vẫn còn hiệu lực ở môi trường thật**. Rủi ro thực tế thấp — kẻ tấn công phải điều khiển được một trang đang chạy trên chính máy nạn nhân — nhưng đúng ra nên lọc theo `NODE_ENV`.

**Quyết định: chưa sửa trước bảo vệ.** Mọi thay đổi trong `backend/src` đều làm lệch số dòng đã chốt ở Bảng 1.6 của báo cáo (4.295 dòng backend), kéo theo phải vá lại `.docx`, slide và hai bản `.pdf`. Đổi một con số đã in để lấy một cải thiện lý thuyết ở sát ngày bảo vệ là không đáng. Đã đưa vào bảng "điểm yếu tự nhận" của tài liệu ôn, để nếu hội đồng có hỏi thì trả lời được ngay và trung thực.

### Hai chỉnh sửa an toàn về số liệu

Cả hai đều **không** đụng phép đếm 162 tệp và không đụng số dòng của Bảng 1.6:

| Việc | Vì sao an toàn |
|---|---|
| Thêm link tài liệu ôn vào dòng mục lục của `README.md` | `*.md` bị loại khỏi phép đếm |
| Thêm `NVIDIA Corporation/` vào `.gitignore` | Thư mục rỗng do driver sinh ra ở gốc dự án; `.gitignore` đã được đếm sẵn, thêm dòng không thêm tệp |

### Đóng băng mã nguồn từ đây

`npm outdated` cho thấy nhiều gói cách bản mới nhất vài phiên bản chính — `express` 4→5, `prisma` 5→7, `typescript` 5→7, `bcryptjs` 2→3. Đây đều là thay đổi phá vỡ. **Không nâng trước ngày bảo vệ.** Đóng băng là quyết định có chủ đích, và đã ghi vào tài liệu ôn để trả lời nếu bị hỏi, chứ không phải sự bỏ sót.

## 06/09/2026 — Chạy hai ca hồi quy S05 và S06 trên môi trường cục bộ

Commit `5f5888d` · Node **v24.19.0** (CI dùng Node 22 — có khác nhánh, ghi nhận để đối chiếu) · Chrome 152.0.7977.76 · DB Docker `postgres:16-alpine` cổng 5433, đã seed lại.

### Kết quả

| Ca | Bước | Kết quả | Bằng chứng |
|---|---|---|---|
| S06 | 1–3 | **PASS** | `POST /api/v1/auth/login → 401` kèm preflight `OPTIONS 204`. **Không có request nào tới `/auth/refresh`.** Thông báo "Email hoặc mật khẩu không đúng" hiện tại form; biến đánh dấu đặt trước khi bấm vẫn còn sau 2,5 s ⇒ trang không tải lại; không có token trong `localStorage`. |
| S06 | 4 | **PASS** | Email chưa đăng ký nhận **đúng cùng một thông báo**, không tiết lộ email có tồn tại hay không. |
| S05 | 1–2 | **PASS** | URL `?search=JavaScript`, danh sách còn đúng khóa JavaScript. |
| S05 | 3–4 | **PASS** | Đổi ngay sang `React`: URL `?search=React`, ô nhập giữ `React`, danh sách còn đúng khóa ReactJS. Không nhảy về từ khóa cũ. |
| S05 | 5–6 | **PASS** | Back: URL, ô nhập, danh sách **cùng nói `JavaScript`**. |
| S05 | 7 | **PASS** | Forward: cả ba quay lại `React`. |
| S05 | 8 | **PASS** | Lặp bước 1–7 với **mọi XHR bị làm trễ 3000 ms**. Response `JavaScript` về **sau** khi người dùng đã chuyển sang `React`; cả ba vẫn nhất quán ở `React`. Back → `JavaScript` đủ ba thứ; Forward → `React` đủ ba thứ. Lịch sử tăng đúng 2 mục. |

Lỗi đã vá `6f3d746` (ô tìm kiếm nhảy về từ khóa cũ) và lỗi `axiosClient.ts` (401 kích hoạt vòng refresh vô ích) **đều không tái phát**.

### Ba trở ngại môi trường, đã xử lý — cần biết nếu dựng lại

1. **Docker Desktop sập khi khởi động từ shell điều khiển từ xa.** `%LOCALAPPDATA%\Docker\log\host\*.log` ghi `initializing backend: ... unable to get 'ProgramData'`. Shell điều khiển thiếu hai biến `ProgramData` và `ALLUSERSPROFILE`; Docker Desktop kế thừa môi trường khuyết đó rồi sập. Đặt lại hai biến rồi khởi động **vẫn sập**. Cách chạy được: gọi qua Explorer — `explorer.exe "<đường dẫn>\Docker Desktop.exe"` — tiến trình khi đó kế thừa môi trường đầy đủ của shell Windows. Engine lên bình thường (server 29.7.2). Mở tay từ Start Menu cũng cho kết quả tương đương.

2. **Browser pane tích hợp không dùng được cho đồ án.** Nó chặn mọi cổng localhost ngoài cổng preview, nên trang ở 5173 không gọi được API ở 3000 (`Failed to fetch`, kể cả `mode:'no-cors'`). **Đây là giới hạn công cụ, không phải lỗi dự án.** Mọi ca phải chạy trong Chrome thật, đúng như mục 0.1 của hướng dẫn vốn đã yêu cầu.

3. **Phím giả lập chỉ vào được khi cửa sổ Chrome đang ở foreground.** Mở terminal A và B bằng `Start-Process` đẩy Chrome xuống dưới; từ đó `computer type` báo thành công nhưng ô nhập vẫn rỗng — một kiểu thất bại im lặng rất dễ nhầm là lỗi ứng dụng. Luôn kiểm lại `input.value` sau khi gõ trước khi kết luận bất cứ điều gì. `SetForegroundWindow` từ tiến trình nền bị Windows chặn; cách chắc chắn là người dùng nhấp một lần vào cửa sổ Chrome.

Không tệp nào trong `backend/src` hay `frontend/src` bị đụng tới. Phép đếm 162 tệp và Bảng 1.6 giữ nguyên.

## 08/09/2026 — Giữ bản sửa CORS/errorHandler, đo lại và đồng bộ toàn bộ số liệu hồ sơ

### Bối cảnh: một phiên công cụ khác đã sửa mã nguồn rồi dừng giữa chừng

Một phiên Codex chạy song song đã sửa `backend/src`, thêm kiểm thử và script, rồi **hết hạn mức trước khi cập nhật hồ sơ**. Kho rơi vào trạng thái xấu nhất: **mã nguồn mới, tài liệu cũ**. Quyết định ngày 06/09 là đóng băng mã nguồn; lần này chọn ngược lại — **giữ bản sửa và làm lại số liệu** — vì hai bản sửa đều đúng và một trong hai chính là điểm yếu đã tự nhận.

### Hai bản sửa được giữ

| Tệp | Nội dung | Kiểm thử bảo vệ |
|---|---|---|
| `backend/src/app.ts` | Danh sách trắng CORS ở môi trường thật chỉ còn `env.feUrl`; hai địa chỉ `localhost` chỉ còn khi chạy phát triển | 5 ca đầu của `httpBoundary.test.ts` |
| `backend/src/middleware/errorHandler.ts` | JSON sai cú pháp → **400**, body vượt 1 MiB → **413** (trước đây cả hai rơi xuống nhánh cuối và trả 500) | 6 ca sau, gồm ca xác nhận không phản chiếu `password`/stack vào response |

Kèm theo: `backend/tests/httpBoundary.test.ts` (12 phép kiểm), `scripts/check-project.ps1`, tách seed khỏi image production trong `docker-compose.full.yml` (image production không cài `ts-node`).

### Hiệu chuẩn cách đếm — bài học quan trọng nhất của lần này

Đo lại bằng `Get-Content | Measure-Object -Line` ra **3.792** dòng backend, lệch 503 so với 4.295 đã in. Nguyên nhân: **`Measure-Object -Line` bỏ qua dòng trống**. Đếm bằng số phần tử ra 4.307 — đúng bằng 4.295 + 12.

Nhưng front-end thì đếm phần tử ra 6.216 trong khi `.docx` in **6.215**, dù `frontend/src` không hề bị đụng. Chênh đúng 1, và đúng bằng số tệp không kết thúc bằng ký tự xuống dòng. Vậy **phép đếm gốc của hồ sơ là `wc -l`** — đếm ký tự `\n`, nên tệp thiếu dòng cuối bị hụt 1.

Kiểm chứng lại bằng `wc -l`, cả ba con số đã in đều tái lập chính xác: back-end 4.295 (nay 4.307), front-end 6.215 (không đổi), kiểm thử 2.078 / 18 tệp (nay 2.135 / 19). **Từ nay đo bằng `wc -l`, không dùng `Measure-Object -Line`.**

Nhân tiện phát hiện mục nhật ký ngày 05/09 chép sai front-end là "6.174 dòng" — con số trong `.docx` (**6.215**) mới đúng. Hồ sơ đúng, nhật ký sai.

### Cổng chất lượng sau khi giữ bản sửa

| Cổng | Kết quả |
|---|---|
| Backend `tsc` · `eslint` | sạch · sạch |
| Backend `npm test` | **357 / 357** (345 cũ + 12 ca `httpBoundary`) |
| Frontend `tsc` · `eslint` · `vitest` | sạch · sạch · 4 tệp / 13 ca |
| Playwright E2E | **6 / 6** |
| `vite build` | 318 ms, gói lớn nhất **323,96 kB** (gzip **102,85 kB**) — không đổi |
| `npm audit` hai phía | **0 lỗ hổng** |

### Số liệu đã đổi trong hồ sơ

| Hạng mục | Cũ | Mới |
|---|---|---|
| Tổng tệp mã nguồn và cấu hình | 162 | **164** |
| Back-end `src` | 4.295 dòng / 58 tệp | **4.307** dòng / 58 tệp |
| Front-end `src` | 6.215 dòng / 52 tệp | không đổi |
| Kiểm thử tự động | 2.078 dòng / 18 tệp | **2.135** dòng / **19** tệp |
| Phép khẳng định | 345 | **357** |
| Tổng dòng TypeScript (slide 15) | 10.510 | **10.522** |
| Tệp test (tài liệu ôn) | 15 | **16** |

Không đổi: 46 điểm cuối · 11 bảng · 3 kiểu liệt kê · 217 dòng lược đồ · 21 màn hình · 14 service · 8 middleware · 72 trang báo cáo.

### Nơi đã sửa

- `docs/BAO-CAO-DO-AN-LearnQuiz.docx` — Bảng 1.6 (4 dòng); Bảng 5.1 thêm dòng `httpBoundary.test.ts` 12 phép và sửa dòng tổng; 10 chỗ ghi `345` khắp báo cáo.
- `docs/SLIDE-BAO-VE-LearnQuiz.pptx` — slide 2, 12, 15; **cả bảng dữ liệu nhúng của biểu đồ cột** slide 12 (cột "HTTP + hồi quy" 81 → 93, tổng cột nay đúng 357).
- `docs/CAU-HOI-BAO-VE.md` — Phần C rút còn sáu điểm yếu (bỏ mục CORS vì đã sửa) và thêm mục "một điểm yếu đã sửa dứt điểm"; Phần D cập nhật số.

⚠️ **Hai tệp `.pdf` cố ý KHÔNG sửa lần này** theo quyết định của chủ nhiệm đề tài. Vì vậy `BAO-CAO-DO-AN-LearnQuiz.pdf` và `SLIDE-BAO-VE-LearnQuiz.pdf` hiện **vẫn in số cũ** và lệch với bản `.docx`/`.pptx`. Muốn khớp thì vá chuỗi số trong PDF như đã làm ngày 05/09 — mọi cặp số lần này đều **cùng độ dài** (162→164, 4.295→4.307, 2.078→2.135, 18→19, 345→357, 10.510→10.522) nên bố cục và số trang 72 sẽ không đổi một li.

### Không đưa bản nguồn Word lên GitHub

Thêm `docs/*.docx` vào `.gitignore` và gỡ khỏi chỉ mục bằng `git rm --cached`. Tệp vẫn nằm trên máy. Phép đếm 164 không đổi vì bộ lọc của Bảng 1.6 vốn đã trừ `docs/`, `*.md`, `package-lock.json` và `.docx`.

## 08/09/2026 (chiều) — Mở rộng dữ liệu mẫu: 7 khóa học, 5 giảng viên

Yêu cầu: thêm 4 khóa học, tham khảo lĩnh vực đào tạo của Trung tâm Tin học ĐH KHTN (csc.edu.vn), làm tên giảng viên phong phú hơn. Tên khóa và toàn bộ nội dung bài học đều tự viết, chỉ lấy **lĩnh vực** làm gợi ý.

### Vì sao việc này không phá số liệu vừa đồng bộ

`backend/prisma/seed.ts` nằm **ngoài** `backend/src`, nên 4.307 dòng của Bảng 1.6 không đổi. Tệp đã tồn tại từ trước nên tổng 164 tệp cũng không đổi. Không đụng `backend/tests` nên 2.135 dòng / 19 tệp và 357 phép khẳng định giữ nguyên. **Không con số nào trong `.docx` hay `.pptx` phải sửa lại vì việc này.**

### Đã thêm

| Khóa | Danh mục | Trạng thái | Giảng viên |
|---|---|---|---|
| Lập trình Python cho người mới bắt đầu | Ngôn ngữ lập trình | published | Nguyễn Hoàng Phúc |
| Phân tích dữ liệu với Excel và Power BI | Dữ liệu & AI *(mới)* | published | Phạm Cẩm Tú |
| Thiết kế giao diện web với Figma | Thiết kế & Đồ họa *(mới)* | pending | Đặng Quốc Bảo |
| Kiểm thử tự động với Selenium | DevOps & Công cụ | draft | Đặng Quốc Bảo |

Ba tài khoản giảng viên mới: `instructor3/4/5@learnquiz.vn`. Hai danh mục mới. Mỗi khóa mới có 1–2 bài học nội dung thật và một quiz 3 câu đúng luật ra đề (đúng 4 đáp án, đúng 1 đáp án đúng).

Giữ nguyên chủ sở hữu của ba khóa cũ để không phá các ca kiểm tra đã đạt.

Dữ liệu mẫu nay: **8 tài khoản · 6 danh mục · 7 khóa học · 13 bài học · 8 quiz · 21 câu hỏi · 84 đáp án**. Trạng thái: 4 published · 2 pending · 1 draft — đủ trình diễn trọn máy trạng thái duyệt nội dung.

### Cổng chất lượng sau khi seed lại

Backend `tsc`/`eslint` sạch · `npm test` **357/357** · frontend `tsc`/`eslint` sạch · vitest **13/13** · Playwright **6/6**. Dữ liệu mẫu mới **không** làm hỏng ca E2E nào.

### Một phát hiện: cơ sở dữ liệu cục bộ có danh mục rác

Truy vấn sau khi seed cho **7** danh mục trong khi `seed.ts` chỉ định nghĩa 6. Dư ra `Trí tuệ nhân tạo` (`tri-tue-nhan-tao`, id 5, **0 khóa học**) — vết còn lại của một lần thử nghiệm trước.

Nguyên nhân gốc: bước dọn dữ liệu của seed **không xóa `categories`** (chỉ xóa từ `answers` xuống `courses`), còn `category` thì dùng `upsert`. Nên mọi danh mục từng được tạo bằng tay đều nằm lại vĩnh viễn và **hiện trong bộ lọc "Danh mục" của trang công khai như một mục rỗng**.

Chưa xử lý — xóa dữ liệu cần chủ nhiệm đề tài đồng ý. Hai hướng: xóa thẳng danh mục rỗng đó khỏi cơ sở dữ liệu cục bộ (nhanh, không đụng mã nguồn), hoặc thêm bước dọn `categories` vào seed (sạch hơn về lâu dài nhưng đụng `seed.ts` và phải cân nhắc ràng buộc khóa ngoại). Ghi lại để quyết sau.

### Tài liệu đã cập nhật theo

- `docs/BAO-CAO-DO-AN-LearnQuiz.docx` — Bảng C.1 thêm ba giảng viên; chú thích `seed.ts` trong cây thư mục; đoạn mô tả dữ liệu mẫu ở phụ lục.
- `docs/HUONG-DAN-KIEM-TRA-TAY.md` — bảng tài khoản mục 0.5 thêm GV3/GV4/GV5; thêm ghi chú về bộ dữ liệu mới và khóa nào dùng cho ca A01, I03.
- Hai bản `.pdf` vẫn giữ nguyên theo quyết định trước. Lần này bảng tài khoản **thay đổi số dòng**, không phải chỉ đổi chữ số, nên **không vá PDF theo cách cũ được** — muốn khớp phải xuất lại từ Word.

## 08/09/2026 (tối) — Dọn danh mục rác trong seed và gọn cây tệp docs/ trên GitHub

### 1. Seed nay dọn cả `categories`

Bước dọn dữ liệu cũ trước đây chạy từ `answers` xuống `courses` nhưng **bỏ sót `categories`**, mà danh mục lại dùng `upsert`. Hệ quả: mọi danh mục từng tạo bằng tay đều nằm lại vĩnh viễn. Cơ sở dữ liệu cục bộ vì thế có `Trí tuệ nhân tạo` với **0 khóa học**, và nó hiện ra trong bộ lọc "Danh mục" của trang công khai như một mục chọn vào thì không ra gì.

Đã thêm `await prisma.category.deleteMany();` ngay sau `course.deleteMany()`. Thứ tự này an toàn: `category` chỉ được `course` tham chiếu, mà `course` vừa bị xóa ở dòng trên. Đồng thời đổi `update: {}` thành `update: { name: c.name }` để đổi tên danh mục trong seed thì lần chạy sau cập nhật theo.

Chạy lại: còn đúng **6 danh mục**, mỗi mục đều có khóa học, không còn mục rỗng.

### 2. Gỡ bảy hồ sơ review cũ khỏi GitHub

`docs/` có 18 tệp, quá nửa là review và kế hoạch của các đợt trước. Đã gỡ khỏi chỉ mục bằng `git rm --cached` và thêm vào `.gitignore` — **tệp vẫn nằm nguyên trên máy**, và lịch sử commit vẫn truy được, nên dấu vết kiểm chứng không mất.

| Tệp gỡ khỏi GitHub | Dung lượng |
|---|---|
| `BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md` | 10 KB |
| `HUONG-DAN-HOAN-THIEN-BAO-CAO.md` | 4 KB |
| `HUONG-DAN-KIEM-TRA-TAY-2026-09-02.md` | 33 KB |
| `HUONG-DAN-SUA-CHUA-TIEN-BAO-VE.md` | 42 KB |
| `KE-HOACH-REVIEW-TOT-NGHIEP-2026-09-02.md` | 28 KB |
| `LUA-CHON-HA-TANG-VERCEL-VS-RENDER.md` | 8 KB |
| `REVIEW-TOT-NGHIEP-2026-09-01.md` | 20 KB |

Trước khi gỡ đã rà liên kết chéo: bảy tệp này **chỉ được nhật ký nhắc tên** (chuyện bình thường của một cuốn biên niên). Riêng `MAU-KET-QUA-KIEM-TRA.md` được `README.md` và `HUONG-DAN-KIEM-TRA-TAY.md` trỏ tới nên **giữ lại**, dù thoạt nhìn cũng giống một tệp phụ trợ.

`docs/` trên GitHub nay còn 11 tệp: báo cáo và slide bản PDF/PPTX, đề án, tài liệu ôn, hướng dẫn kiểm tra tay hiện hành, mẫu kết quả, hướng dẫn triển khai, nhật ký và `hinh-ve.zip`.

Việc này **không đụng phép đếm 164 tệp** — bộ lọc của Bảng 1.6 vốn đã trừ toàn bộ `docs/`.

## 08/09/2026 (tối, tiếp) — Gỡ thêm bốn tệp khỏi GitHub, `docs/` còn bảy

Gỡ bằng `git rm --cached` và chặn trong `.gitignore` — **tệp vẫn nằm nguyên trên máy**:

| Tệp | Lý do giữ riêng |
|---|---|
| `CAU-HOI-BAO-VE.md` | Tài liệu ôn cá nhân, gồm cả bảng điểm yếu tự nhận — không cần công khai |
| `HUONG-DAN-DEPLOY-CHI-TIET.pdf` | Bản PDF của hướng dẫn triển khai; `DEPLOY.md` vẫn ở lại |
| `SLIDE-BAO-VE-LearnQuiz.pdf` | Slide bảo vệ |
| `SLIDE-BAO-VE-LearnQuiz.pptx` | Bản nguồn của slide |

### Một liên kết chết đã kịp chặn

`README.md` dòng 6 có cụm `🎓 Ôn bảo vệ: [docs/CAU-HOI-BAO-VE.md](docs/CAU-HOI-BAO-VE.md)`. Gỡ tệp mà để nguyên dòng đó thì **trang chủ kho có ngay một liên kết 404** — thứ đập vào mắt đầu tiên khi ai đó mở kho. Đã bỏ hẳn cụm này; các liên kết còn lại trong dòng 6 đều trỏ tới tệp vẫn ở trên GitHub.

Ba tệp còn lại không được `README.md` hay bất kỳ tài liệu giữ lại nào trỏ tới — chỉ nhật ký nhắc tên, mà đó là chuyện bình thường của biên niên.

### `docs/` trên GitHub nay còn 7 tệp

`BAO-CAO-DO-AN-LearnQuiz.pdf` · `DE-AN.md` · `DEPLOY.md` · `HUONG-DAN-KIEM-TRA-TAY.md` · `MAU-KET-QUA-KIEM-TRA.md` · `NHAT-KY-DU-AN.md` · `hinh-ve.zip`

Trên đĩa vẫn đủ 20 tệp. Phép đếm **164 không đổi** — bộ lọc Bảng 1.6 vốn đã trừ toàn bộ `docs/`.
