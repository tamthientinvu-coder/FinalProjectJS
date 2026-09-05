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
| E2E | `frontend/e2e/role-routing.spec.ts` | 3 ca (Playwright) |
| Mã nguồn back-end | `backend/src/**/*.ts` | 58 tệp / 4.295 dòng |
| Mã nguồn front-end | `frontend/src/**/*.{ts,tsx}`, trừ tệp test | 52 tệp / 6.174 dòng |
| Mã nguồn kiểm thử | `backend/tests` (13) + 4 tệp vitest + 1 tệp e2e | 18 tệp / 1.993 dòng |
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

### 6. Đề xuất tối ưu — chưa thực hiện, chờ quyết định

- **`Course.instructorId` chưa có chỉ mục.** Truy vấn "khóa học của tôi" (`InstructorCoursesPage`) lọc theo cột này. Thêm `@@index([instructorId])` vào `schema.prisma` là cải thiện đúng về mặt kỹ thuật, **nhưng** kéo theo một migration mới → phải chạy `prisma migrate deploy` trên Render. Với lượng dữ liệu demo hiện tại thì lợi ích không đo được, còn rủi ro triển khai sát ngày bảo vệ là có thật. **Khuyến nghị: hoãn tới sau buổi bảo vệ.**
- Các cột khóa ngoại còn lại đều đã được chỉ mục gián tiếp qua ràng buộc `@@unique` (cột dẫn đầu), nên không thiếu chỉ mục ở chỗ nào khác.
- Không tìm thấy `await` bên trong vòng lặp ở tầng service (đã rà `src/services/*.ts`) — không còn N+1 nào ngoài chỗ đã sửa ở commit `e63ad5c`.
