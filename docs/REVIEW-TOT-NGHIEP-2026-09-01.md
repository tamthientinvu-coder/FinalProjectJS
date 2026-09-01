# BÁO CÁO REVIEW MỨC ĐỘ SẴN SÀNG TỐT NGHIỆP — LEARNQUIZ

> **Trạng thái:** Đây là ảnh chụp đánh giá *trước khắc phục* tại commit `c4b99d0`.
> Các finding F1–F12 đã được xử lý và kiểm định lại; xem
> [BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md](./BAO-CAO-KHAC-PHUC-TOI-UU-2026-09-01.md)
> để dùng làm kết luận bàn giao cuối.

**Ngày review:** 01/09/2026  
**Phạm vi:** toàn bộ `FinalProject` tại commit `c4b99d0`, đối chiếu với đề gốc `ĐỀ TÀI 4 — Nền Tảng Học Tập & Quiz Trực Tuyến.docx`  
**Phương pháp:** đọc mã nguồn theo hai trục Spec/Standards; chạy typecheck, test, build, Prisma validate, npm audit; smoke test deployment production; kiểm tra báo cáo Word.  
**Nguyên tắc:** không coi README hoặc báo cáo tự khai là bằng chứng nếu chưa thấy code/test hoặc kết quả chạy.

## 1. Kết luận điều hành

LearnQuiz **khớp gần đầy đủ danh mục chức năng của đề tài**: đủ ba vai trò, đủ các màn hình và API chính, đúng stack bắt buộc, có Docker/CI/cloud và có tính năng Gemini bắt buộc. Toàn bộ kiểm tra tự động hiện có đều xanh.

Tuy nhiên, dự án **chưa đạt trạng thái tối ưu để chốt bản nộp cuối** vì còn các lỗi nghiệp vụ và toàn vẹn dữ liệu mà test hiện tại không bắt được. Có 5 nhóm cần ưu tiên trước bảo vệ:

1. Có thể đánh dấu hoàn thành một bài đang bị khóa bằng cách gọi API trực tiếp.
2. Giảng viên có thể sửa nội dung đã được admin duyệt mà không cần duyệt lại.
3. Xóa lesson/quiz có thể cascade xóa lịch sử điểm và câu trả lời.
4. Thay đổi `passScore` làm đổi hồi tố trạng thái đạt/rớt của bài đã nộp.
5. Báo cáo Word còn sai số test, thiếu mã học viên và không qua kiểm tra schema DOCX.

**Đánh giá:** đủ nền tảng để bảo vệ và demo; chưa nên tuyên bố “hoàn tất tối ưu/production-ready” trước khi xử lý các P1 bên dưới.

## 2. Bằng chứng kiểm tra thực tế

| Hạng mục | Kết quả |
|---|---|
| Backend test | Đạt toàn bộ 324 phép khẳng định, exit code 0 |
| Backend typecheck | Đạt |
| Backend build | Đạt |
| Frontend test | 3 test files, 10/10 test đạt |
| Frontend production build | Đạt; cảnh báo bundle JS 863.08 kB, gzip 265.31 kB |
| Prisma schema | `prisma validate` đạt |
| Dependency audit production | Backend 0 vulnerability; frontend 0 vulnerability |
| Production backend | `/health` trả `status=ok`, `db=up` |
| Production public API | Danh sách khóa học trả envelope hợp lệ, có 2 khóa public tại thời điểm kiểm tra |
| Production frontend | `/` và `/login` trả SPA HTML và bundle thật |
| CORS | Origin Vercel được cấp `access-control-allow-origin`; origin lạ không được cấp header này |
| Git worktree | Không có file source bị thay đổi trong quá trình review; nhánh `main` đang ahead `origin/main` 3 commit |

Giới hạn: browser automation của gstack không chạy được do WSL trên máy lỗi mount VHDX, nên chưa thực hiện E2E tương tác thật trên UI. Smoke HTTP production đã được chạy thay thế nhưng không chứng minh toàn bộ luồng đăng nhập/ba vai trò/Gemini.

## 3. Ma trận đối chiếu yêu cầu tốt nghiệp

### 3.1. Student — 4 điểm

| Yêu cầu | Trạng thái | Bằng chứng chính | Ghi chú |
|---|---|---|---|
| Danh sách, filter category/độ khó | Đạt | `courseService.listPublished`, `CourseListPage` | Có search, sort, phân trang ngoài yêu cầu |
| Enroll miễn phí | Đạt có lỗi phân quyền | `POST /courses/:id/enroll`, unique DB | Route chưa giới hạn role student |
| Học tuần tự video/text | Đạt một phần | `lessonRules.computeUnlock`, `getLessonContent`, `LearnPage` | API complete có thể vượt khóa — Finding F1 |
| Đánh dấu hoàn thành | Đạt một phần | `LessonProgress`, `markComplete` | Thiếu assert unlocked — Finding F1 |
| Làm quiz/nộp/xem điểm ngay | Đạt | Server-side grading, test chống gửi `score=100` | Không rò đáp án trước nộp |
| Xem lại đúng/sai | Đạt | `getSubmission`, `QuizResultPage` | Có phân quyền owner/instructor/admin |
| Tiến độ % và điểm trung bình | Đạt | `enrollmentService.listMine` | Lấy điểm tốt nhất mỗi quiz rồi tính trung bình |
| Làm lại nếu chưa đạt | Đạt một phần | `maxAttempts`, `attemptNo` | Vẫn cho làm lại sau khi đã đạt — Finding F7 |
| AI giải thích đáp án sai | Đạt theo code/test | `aiService.explainWrongAnswer` | Có cache và prompt dùng nội dung bài; chưa gọi live production do cần tài khoản |

### 3.2. Instructor — 4 điểm

| Yêu cầu | Trạng thái | Bằng chứng chính | Ghi chú |
|---|---|---|---|
| Tạo course đủ trường | Đạt một phần | `CourseFormPage`, `courseService.create` | Description/category/thumbnail đều optional; course thiếu dữ liệu vẫn gửi duyệt được |
| Thêm lesson, thứ tự quan trọng | Đạt | unique `(courseId, order)`, API reorder transaction | Có kiểm tra danh sách reorder đầy đủ |
| Quiz, mỗi câu đúng 4 lựa chọn/1 đúng | Đạt | Yup schema, transaction, editor | AI output dùng cùng validator |
| Stats enroll và điểm trung bình lớp | Đạt | `adminService.getCourseStats`, `CourseStatsPage` | Test nghiệp vụ sâu |
| Sửa/xóa lesson, question | Đạt chức năng nhưng rủi ro | Editor thay toàn bộ bộ câu hỏi; delete lesson/quiz | Hard-delete có thể xóa lịch sử — Finding F3 |

### 3.3. Admin — 2 điểm

| Yêu cầu | Trạng thái | Bằng chứng chính | Ghi chú |
|---|---|---|---|
| Duyệt trước khi public | Đạt ban đầu, chưa kín vòng đời | State machine draft/pending/published/rejected | Nội dung published vẫn sửa không cần duyệt lại — Finding F2 |
| CRUD category | Đạt | Category routes/service/UI | Chặn xóa category đang dùng |
| Khóa tài khoản | Đạt có race condition | Xóa refresh token; access token cũ bị DB check | Hai admin có thể đồng thời khóa nhau — Finding F5 |
| Top course/tổng quan | Đạt | `/admin/stats`, dashboard | Chỉ xếp hạng published course |

### 3.4. Công nghệ/triển khai

Đạt yêu cầu Node.js, Express, Prisma, PostgreSQL, React, REST `/api/v1`, Docker và deploy cloud. Vercel frontend và Render backend đang phản hồi thật. Gemini model mặc định `gemini-3.6-flash` là model stable hợp lệ tại ngày review.

## 4. Findings chi tiết

### F1 — P1: Có thể hoàn thành bài đang khóa bằng API trực tiếp

**Bằng chứng:** `backend/src/services/lessonService.ts:276-298`. `markComplete()` chỉ kiểm tra enrollment rồi `upsert` progress; không gọi `computeUnlock`/không xác nhận bài hiện tại được mở. Route `backend/src/routes/lessonRoutes.ts:33-39` cũng chỉ authenticate + validate.

**Tác động:** học viên biết `lessonId` có thể đánh dấu bài 2/3/... hoàn thành mà không học bài trước; phần trăm tiến độ sai và các bài sau có thể được mở khóa. Đây là sai trực tiếp yêu cầu “học từng bài theo thứ tự”.

**Tái hiện:** enroll khóa có ít nhất 3 bài; chưa complete bài 1; gọi `PATCH /api/v1/lessons/<id-bai-2>/complete` với `{ "isCompleted": true }`; hiện service sẽ ghi progress thay vì trả 403.

**Sửa:** dùng cùng policy mở khóa như `getLessonContent` và `quizService`; chỉ cho complete khi lesson unlocked. Khi bỏ complete, cần định nghĩa rõ có cho phép làm tụt lộ trình hay không.

**Acceptance criteria:** API trên trả 403 cho bài khóa; không tạo `LessonProgress`; progress giữ nguyên; thêm HTTP test cho complete bài 2 trước bài 1 và bài 3 sau khi chỉ complete bài 1.

### F2 — P1: Nội dung đã duyệt vẫn bị sửa trực tiếp, làm vô hiệu quy trình admin approval

**Bằng chứng:** `backend/src/services/courseService.ts:163-180` update chỉ kiểm ownership; `backend/src/services/lessonService.ts:63-118` create/update/delete lesson chỉ kiểm quyền; `backend/src/services/quizService.ts:178-197` update/delete quiz không kiểm `Course.status`.

**Tác động:** admin duyệt phiên bản A, sau đó instructor sửa thành phiên bản B và B vẫn public ngay. Nội dung public không còn là nội dung đã được duyệt; có thể xóa cả lesson/quiz sau duyệt.

**Tái hiện:** publish một course; đăng nhập instructor; PATCH course hoặc lesson; GET public course/learn view sẽ thấy nội dung mới mà không qua pending.

**Sửa:** phương án tối thiểu là chỉ cho instructor sửa course/lesson/quiz khi status `draft|rejected`; mọi thay đổi đối với published phải đưa course về draft/pending và ẩn khỏi public. Phương án tốt hơn là version hóa draft để phiên bản đang học không biến mất.

**Acceptance criteria:** instructor sửa tài nguyên thuộc pending/published nhận 409 hoặc tạo revision; public chỉ đổi sau lần admin publish tiếp theo; có test API cho course, lesson và quiz.

### F3 — P1: Hard-delete lesson/quiz cascade xóa lịch sử học tập

**Bằng chứng:** `lessonService.remove()` gọi thẳng delete tại `backend/src/services/lessonService.ts:114-118`; `quizService.remove()` tại `backend/src/services/quizService.ts:191-197`. Prisma đặt cascade Lesson→Quiz, Quiz→QuizSubmission và Submission→Answer trong `backend/prisma/schema.prisma`.

**Tác động:** instructor có thể làm mất điểm, đáp án, AI explanation và progress của học viên. Course delete có chặn khi đã enroll nhưng lesson/quiz delete lại không có hàng rào tương đương.

**Tái hiện:** student submit quiz; instructor xóa quiz hoặc lesson; kiểm tra submission cũ và các Answer biến mất theo cascade.

**Sửa:** cấm hard-delete khi đã có submission/progress; dùng soft-delete/archive hoặc version hóa; đổi FK quan trọng sang `Restrict` nếu phù hợp.

**Acceptance criteria:** delete quiz/lesson sau khi có dữ liệu học tập trả 409; toàn bộ submission/answer/progress còn nguyên; có integration test dùng PostgreSQL thật.

### F4 — P1: Race giữa sửa bộ câu hỏi và nộp bài có thể làm mất Answer

**Bằng chứng:** `quizService.upsert` đọc `_count.submissions` ở `backend/src/services/quizService.ts:123-134` ngoài transaction; sau đó transaction xóa toàn bộ question tại dòng 142-174. Một submission có thể được tạo giữa hai thời điểm.

**Tác động:** submission có thể còn score nhưng Answer bị cascade xóa khi request sửa đề thắng race; mất khả năng xem lại đúng/sai.

**Sửa:** check và rewrite trong transaction isolation `Serializable`/lock cùng quiz; tốt nhất không rewrite hard-delete mà version hóa question set.

**Acceptance criteria:** concurrency test chạy submit và upsert song song nhiều lần; không tồn tại submission thiếu Answer; khi một bên đã bắt đầu, bên kia phải 409/retry an toàn.

### F5 — P1: Race có thể khóa toàn bộ admin

**Bằng chứng:** `backend/src/services/adminService.ts:200-216` đếm active admin rồi update ở thao tác riêng. Hai request A khóa B và B khóa A có thể cùng đọc count=2, sau đó cùng khóa thành công.

**Tác động:** hệ thống còn 0 admin hoạt động và không thể quản trị qua UI.

**Sửa:** transaction Serializable + retry hoặc invariant/locking tại DB.

**Acceptance criteria:** concurrency test hai admin khóa nhau; đúng một request thành công, request kia 409; DB luôn còn ít nhất một active admin.

### F6 — P2: Role không được chặn ở các endpoint học viên

**Bằng chứng:** enroll route `backend/src/routes/courseRoutes.ts:102`, complete route `backend/src/routes/lessonRoutes.ts:33-39`, submit route `backend/src/routes/quizRoutes.ts:29-35` thiếu `authorize("student")`; service enroll ghi theo `viewer.id` cho mọi role.

**Tác động:** instructor/admin có thể enroll course người khác rồi nộp quiz, làm bẩn thống kê lớp và phá ranh giới ba vai trò mà tài liệu mô tả.

**Sửa:** thêm `authorize("student")` ở route và `assertStudent` ở service để defense-in-depth.

**Acceptance criteria:** instructor/admin gọi enroll, complete, submit, list-mine nhận 403; không có Enrollment/Submission mới.

### F7 — P2: Cho làm lại sau khi đã đạt

**Bằng chứng:** `backend/src/services/quizService.ts:259-274` chỉ xét còn lượt; `frontend/src/pages/QuizResultPage.tsx:85,132` hiện “Làm lại” nếu còn lượt, không xét `submission.passed`.

**Tác động:** lệch câu chữ đề bài “làm lại quiz nếu chưa đạt”; tạo thêm attempt không cần thiết và ảnh hưởng thống kê số lượt/điểm trung bình lớp.

**Sửa:** `canAttempt = !passedBestAttempt && hasAttemptLeft`, hoặc ghi rõ trong đặc tả rằng hệ thống cho cải thiện điểm sau khi đạt và thống nhất cách thống kê.

**Acceptance criteria:** sau một lượt đạt, API submit tiếp trả 409 và UI ẩn nút; sau lượt chưa đạt, retry vẫn hoạt động đến maxAttempts.

### F8 — P2: Thay passScore làm đổi hồi tố kết quả cũ

**Bằng chứng:** `quizService.updateMeta` cho đổi passScore sau submission (`backend/src/services/quizService.ts:177-188`); `getSubmission` tính `passed` bằng passScore hiện tại (`:369-423`).

**Tác động:** bài từng đạt có thể thành rớt khi instructor đổi ngưỡng; lịch sử học tập không ổn định.

**Sửa:** lưu `passScoreAtSubmission`/`passed` snapshot; hoặc khóa passScore khi đã có submission.

**Acceptance criteria:** đổi metadata không thay kết quả lịch sử; test một bài score 60 tại threshold 50 rồi đổi threshold 70 vẫn giữ `passed=true` cho submission cũ.

### F9 — P2: Điều kiện gửi duyệt course quá lỏng

**Bằng chứng:** description/category/thumbnail optional trong `backend/src/schemas/courseSchema.ts:12-25`; `submitForReview` chỉ kiểm `lessonCount > 0` trong `backend/src/services/courseService.ts`.

**Tác động:** course thiếu mô tả, category, thumbnail vẫn vào hàng duyệt và có thể public, trong khi đề liệt kê các trường này ở chức năng tạo course.

**Sửa:** validate completeness ở thời điểm submit (không nhất thiết lúc lưu draft): title, description có độ dài tối thiểu, category tồn tại, thumbnail URL hợp lệ, ít nhất một lesson và quiz nếu hội đồng kỳ vọng quiz cuối bài.

**Acceptance criteria:** draft vẫn lưu dở được; submit thiếu field trả 400 với danh sách field; course đầy đủ gửi pending thành công.

### F10 — P2: Frontend chưa có coverage cho luồng người dùng

**Bằng chứng:** frontend chỉ có 10 unit test trong 3 file utility/config; không có component test hoặc E2E. Production smoke chỉ kiểm health, public courses và bundle, không đăng nhập/role/quiz/AI.

**Tác động:** lỗi liên kết UI–API, route protection và các nút nghiệp vụ có thể lọt dù build xanh.

**Sửa:** thêm Playwright smoke cho ba kịch bản bảo vệ; tối thiểu student enroll→learn→submit→review, instructor create/edit→submit, admin approve→lock user.

**Acceptance criteria:** CI chạy E2E trên DB disposable; có artifact screenshot/trace khi fail; ít nhất một test xác nhận UI không lộ `isCorrect` trước submit.

### F11 — P3: Bundle frontend lớn và chưa code-split theo route

**Bằng chứng:** Vite cảnh báo bundle chính 863.08 kB; `frontend/src/router/index.tsx` import eager toàn bộ 21 màn hình.

**Tác động:** tải lần đầu chậm hơn, rõ nhất khi cold start/mobile.

**Sửa:** dùng route `lazy`/`React.lazy` cho instructor/admin/editor; cân nhắc manual chunks cho MUI/vendor.

**Acceptance criteria:** build không còn chunk >500 kB hoặc có budget được giải trình; các route lazy tải thành chunk riêng; không regress navigation.

### F12 — P3: Thiếu lint/format gate

**Bằng chứng:** package scripts của backend/frontend không có lint; CI chỉ typecheck, test, build và audit.

**Tác động:** lỗi hook/dependency, dead code và style không được chặn tự động; source đang có comment vô hiệu `react-hooks/exhaustive-deps` ở các page.

**Sửa:** ESLint TypeScript/React Hooks + Prettier hoặc Biome; thêm `npm run lint` vào CI.

**Acceptance criteria:** lint sạch; chỉ disable rule có lý do cụ thể; CI fail khi có violation.

## 5. Lỗi hồ sơ/báo cáo tốt nghiệp

1. `docs/BAO-CAO-DO-AN-LearnQuiz.docx` còn “Mã học viên: ..............................” tại `/body/p[21]` và `/body/p[51]`.
2. Báo cáo Word vẫn ghi **318/318** ở 10 vị trí, trong khi suite hiện tại chạy **324/324**; không có vị trí nào ghi 324.
3. `officecli validate` báo **13 lỗi DOCX**: 11 lỗi thứ tự phần tử paragraph border, 1 `docPr id` trùng, 1 giá trị numbering `lvlJc=start` không hợp lệ.
4. `view issues` báo nhiều cảnh báo cấu trúc/format; phần lớn empty paragraph có thể là bố cục có chủ đích, nhưng dangling style reference và lỗi schema phải xử lý trước khi nộp.
5. `docs/DE-AN.md` vẫn có placeholder “(điền họ tên)” và “(điền tên GVHD)” dù báo cáo Word đã có tên thật.

**Acceptance criteria tài liệu:** điền mã học viên; thống nhất 324/324 (và cập nhật nếu suite đổi); validate DOCX không lỗi; mở Word cập nhật TOC/field; soát PDF cuối cùng theo từng trang; đảm bảo README, DE-AN, DOCX và slide dùng cùng số liệu/URL/model.

## 6. Thứ tự xử lý đề xuất

1. F1 — khóa API complete theo lộ trình.
2. F2 — đóng vòng đời duyệt nội dung published.
3. F3/F4 — bảo toàn submission/answer khi sửa/xóa.
4. F5 — bảo vệ invariant còn ít nhất một admin.
5. F6/F7/F8/F9 — siết role, retry, snapshot điểm và completeness.
6. F10 — E2E ba vai trò; sau đó F11/F12.
7. Sửa báo cáo Word/PDF/slide và chạy lại toàn bộ gate.

## 7. Release gate đề nghị trước ngày bảo vệ

- Không còn P1 mở.
- Backend typecheck/build/test, frontend test/build, Prisma validate, npm audit đều xanh.
- Thêm integration test PostgreSQL thật cho cascade/concurrency.
- Chạy E2E ba vai trò trên môi trường staging hoặc production demo reset được.
- Test live một lời gọi Gemini giải thích đáp án sai bằng tài khoản demo.
- Production health, public course, login, refresh, CORS đều đạt.
- DOCX validate sạch; PDF được kiểm tra trực quan; mã học viên và số test thống nhất.
- Tag/commit nộp bài được push; hiện local `main` đang ahead `origin/main` 3 commit nên cần push sau khi review/fix hoàn tất.

## 8. Phạm vi thay đổi trong lần review

Không sửa source code, database hay deployment. Chỉ tạo báo cáo review này. Đây là chủ đích: yêu cầu hiện tại là review và đánh giá; mọi sửa nghiệp vụ cần được thực hiện thành một đợt riêng có test hồi quy tương ứng.
