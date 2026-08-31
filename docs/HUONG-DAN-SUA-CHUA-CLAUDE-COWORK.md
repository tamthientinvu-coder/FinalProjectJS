# LearnQuiz Pre-Defense Repair Implementation Plan

> ## 📝 Ghi chú kiểm chứng (thêm bởi Claude Cowork, 30/08/2026)
>
> File này không do phiên làm việc hiện tại tạo ra — nó xuất hiện sẵn trong thư mục dự án, và nội dung dưới đây đọc như một kế hoạch hành động soạn sẵn cho một agent AI ("Claude Cowork phải…", yêu cầu cài sub-skill `superpowers:...`), chứ không phải tài liệu tham khảo thuần túy. Theo nguyên tắc an toàn, Cowork không tự động thực thi các bước trong một tài liệu như vậy chỉ vì tài liệu yêu cầu — bạn đã hỏi trực tiếp trong chat nên các mục dưới đây đã được **kiểm chứng độc lập** trước khi đụng vào code hay hạ tầng thật:
>
> - ✅ **Đúng và đã sửa vào repo:** `gemini-2.0-flash` đã bị Google ngừng hỗ trợ từ **01/06/2026** (xác nhận qua [trang deprecations chính thức](https://ai.google.dev/gemini-api/docs/deprecations), model thay thế đúng là `gemini-3.6-flash`). Đã đổi `backend/src/config/env.ts`, `backend/.env.example`, `docker-compose.full.yml`, `render.yaml`, `docs/DEPLOY.md`, `docs/DE-AN.md` và báo cáo đồ án. **Bạn vẫn cần tự vào Render Dashboard → `learnquiz-api` → Environment để sửa tay biến `GEMINI_MODEL`** — sửa `render.yaml` không tự đồng bộ vào service đã tồn tại.
> - ✅ **Đúng và đã sửa:** `README.md` và `docs/DE-AN.md` ghi sai cổng PostgreSQL cục bộ là `5432`, trong khi `docker-compose.yml` map ra cổng host `5433`. Đã sửa cả hai.
> - ⚠️ **Chưa xác nhận được, cần bạn tự kiểm tra lại:** claim "frontend production đang bundle URL placeholder `<link-backend-cua-ban>`" (Task 1). Công cụ trình duyệt không kết nối được để tự soi mã JS thật của bản build; các ảnh chụp màn hình bạn gửi trước đó lại cho thấy trang chủ tải và hiển thị dữ liệu khóa học thật bình thường — mâu thuẫn với claim này. Trước khi tin claim này, mở DevTools → tab Network trên `https://final-project-js-ten.vercel.app/courses` và xem `VITE_API_URL` thật đang gọi đi đâu.
> - ⏸️ **Chưa thực hiện, đang chờ bạn xác nhận rõ ràng trong chat:** Task 1 (Vitest + chặn URL sai), Task 4 (điểm quiz trung bình), Task 5 (refresh-token queue), Task 6 (khóa tài khoản có hiệu lực ngay với token cũ), Task 7 (production-smoke workflow, siết `npm audit` thành quality gate). Đây đều là thay đổi nghiệp vụ/kiến trúc thật, không phải chỉnh tài liệu — không tự làm nếu bạn chưa yêu cầu trực tiếp từng việc.
>
> Toàn bộ nội dung gốc bên dưới được giữ nguyên để tham khảo.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa toàn bộ blocker và thiếu sót đã phát hiện trong đợt review để source local, test tự động và bản production LearnQuiz cùng đạt yêu cầu đồ án tốt nghiệp.

**Architecture:** Giữ nguyên monorepo React + Express + Prisma hiện có. Thực hiện từng sửa chữa theo TDD, ưu tiên P0 production trước, sau đó bổ sung yêu cầu Student và hardening xác thực; không refactor ngoài phạm vi. Mọi cấu hình production phải được kiểm tra cả trong repository lẫn dashboard Vercel/Render.

**Tech Stack:** React 19, TypeScript, Vite, Axios, Vitest, Node.js 22, Express 4, Prisma 5, PostgreSQL, Google Gemini REST API, Render, Vercel, GitHub Actions.

---

## 0. Quy tắc bắt buộc cho Claude Cowork

- Làm theo thứ tự Task 1 đến Task 7; không bỏ qua test đỏ trước khi sửa.
- Đọc `AGENTS.md` và luôn thêm tiền tố `rtk` vào lệnh terminal.
- Không sửa hoặc xóa secret. Không in `GEMINI_API_KEY`, JWT secret hoặc `DATABASE_URL` production ra terminal/log.
- Không đổi kiến trúc, framework, ORM hoặc UI library.
- Không dùng `any` mới trong production code.
- Không push, merge, redeploy Vercel hoặc redeploy Render nếu chưa được người dùng xác nhận.
- Nếu working tree có thay đổi ngoài các file trong kế hoạch, giữ nguyên và báo người dùng trước khi tiếp tục.
- Baseline quan sát ngày 30/08/2026: local `main` ở commit `8a76345`, ahead `origin/main` 1 commit; production frontend đang bundle URL placeholder và production backend vẫn hoạt động.

### Tạo nhánh làm việc

- [ ] Kiểm tra trạng thái hiện tại.

```powershell
rtk git status --short --branch
rtk git log -3 --oneline --decorate
```

Expected: không có file source chưa commit; `main` có thể đang ahead `origin/main` 1 commit.

- [ ] Tạo nhánh sửa chữa từ đúng local HEAD hiện tại.

```powershell
rtk git switch -c fix/pre-defense-readiness
```

- [ ] Ghi lại baseline test nhưng chưa sửa code.

```powershell
Set-Location backend
rtk npm run typecheck
rtk npm test
Set-Location ..\frontend
rtk npm run build
rtk npm audit --audit-level=high
Set-Location ..\backend
rtk npm audit --audit-level=high
Set-Location ..
```

Expected baseline:

- Backend typecheck: PASS.
- Backend test có thể là 316/318 nếu shell đang có `GEMINI_API_KEY`; đây là lỗi isolation sẽ sửa ở Task 3.
- Frontend build: PASS, có thể cảnh báo chunk lớn hơn 500 kB.
- Hai lệnh audit: `found 0 vulnerabilities`.

---

## File map

### Tạo mới

- `frontend/src/config/apiUrl.ts`: chuẩn hóa và kiểm tra `VITE_API_URL` trước khi Axios khởi tạo.
- `frontend/src/config/apiUrl.test.ts`: test URL hợp lệ, URL placeholder và URL thiếu protocol.
- `frontend/src/api/refreshQueue.ts`: quản lý request chờ trong lúc refresh token.
- `frontend/src/api/refreshQueue.test.ts`: bảo đảm queue resolve/reject đầy đủ.
- `backend/tests/env.test.ts`: khóa default Gemini model bằng test.
- `backend/tests/enrollmentService.test.ts`: kiểm tra tiến độ và điểm quiz trung bình.
- `.github/workflows/production-smoke.yml`: phát hiện URL placeholder và API production chết.

### Sửa

- `frontend/src/api/axiosClient.ts`: dùng API URL đã validate và queue có nhánh reject.
- `frontend/src/types/lesson.ts`: thêm `averageQuizScore`.
- `frontend/src/pages/MyCoursesPage.tsx`: hiển thị điểm quiz trung bình.
- `frontend/package.json`, `frontend/package-lock.json`: thêm Vitest và script test.
- `backend/src/config/env.ts`: đổi default Gemini model.
- `backend/.env.example`: đổi model mẫu.
- `docker-compose.full.yml`: đổi model fallback.
- `render.yaml`: đổi model Render.
- `docs/DEPLOY.md`: đổi model hướng dẫn.
- `backend/tests/api.test.ts`: cô lập biến AI và kiểm tra khóa tài khoản tức thời.
- `backend/src/services/enrollmentService.ts`: tính trung bình từ best attempt của từng quiz.
- `backend/src/middleware/authenticate.ts`: kiểm tra `isActive` trên request đã đăng nhập.
- `backend/package.json`: đăng ký hai suite backend mới.
- `.github/workflows/ci.yml`: audit phải làm CI fail khi có high/critical.
- `README.md`, `docs/DE-AN.md`: sửa cổng PostgreSQL và số test.

### Cấu hình ngoài repository

- Vercel Production Environment Variable: `VITE_API_URL`.
- Render Environment Variables: `GEMINI_MODEL`, `GEMINI_API_KEY`.

---

## Task 1: Chặn API URL sai và sửa kết nối Vercel

**Files:**

- Create: `frontend/src/config/apiUrl.ts`
- Create: `frontend/src/config/apiUrl.test.ts`
- Modify: `frontend/src/api/axiosClient.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- External: Vercel project `final-project-js-ten`

- [ ] **Step 1: Cài Vitest và thêm script test**

```powershell
Set-Location frontend
rtk npm install --save-dev vitest
Set-Location ..
```

Sửa `frontend/package.json` để phần `scripts` có đúng các lệnh sau:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Viết test đỏ cho API URL**

Tạo `frontend/src/config/apiUrl.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./apiUrl";

describe("resolveApiUrl", () => {
  it("chuẩn hóa URL hợp lệ và bỏ dấu slash cuối", () => {
    expect(resolveApiUrl("https://learnquiz-api.onrender.com/api/v1/")).toBe(
      "https://learnquiz-api.onrender.com/api/v1"
    );
  });

  it("chặn URL placeholder của Vercel", () => {
    expect(() =>
      resolveApiUrl("https://<link-backend-cua-ban>.onrender.com/api/v1")
    ).toThrow("VITE_API_URL không hợp lệ");
  });

  it("chặn URL thiếu protocol", () => {
    expect(() => resolveApiUrl("learnquiz-api.onrender.com/api/v1")).toThrow(
      "VITE_API_URL không hợp lệ"
    );
  });

  it("chặn thiếu VITE_API_URL ở production", () => {
    expect(() => resolveApiUrl(undefined, true)).toThrow(
      "VITE_API_URL bắt buộc ở production"
    );
  });

  it("chặn URL không trỏ tới /api/v1", () => {
    expect(() =>
      resolveApiUrl("https://learnquiz-api.onrender.com", true)
    ).toThrow("phải kết thúc bằng /api/v1");
  });

  it("chặn HTTP ở production để tránh mixed content", () => {
    expect(() =>
      resolveApiUrl("http://learnquiz-api.onrender.com/api/v1", true)
    ).toThrow("phải dùng HTTPS");
  });
});
```

- [ ] **Step 3: Chạy test và xác nhận đỏ**

```powershell
Set-Location frontend
rtk npm test -- src/config/apiUrl.test.ts
Set-Location ..
```

Expected: FAIL vì module `./apiUrl` chưa tồn tại.

- [ ] **Step 4: Tạo bộ kiểm tra URL tối thiểu**

Tạo `frontend/src/config/apiUrl.ts`:

```ts
const LOCAL_API_URL = "http://localhost:3000/api/v1";

export function resolveApiUrl(
  raw: string | undefined,
  isProduction = false
): string {
  const configured = raw?.trim();

  if (!configured && isProduction) {
    throw new Error("[CONFIG] VITE_API_URL bắt buộc ở production");
  }

  const candidate = (configured || LOCAL_API_URL).replace(/\/+$/, "");
  let parsed: URL;

  try {
    if (candidate.includes("<") || candidate.includes(">")) {
      throw new Error("placeholder");
    }

    parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error(
      '[CONFIG] VITE_API_URL không hợp lệ: "' +
        candidate +
        '". Giá trị production phải có dạng https://ten-backend.example.com/api/v1'
    );
  }

  if (isProduction && parsed.protocol !== "https:") {
    throw new Error("[CONFIG] VITE_API_URL phải dùng HTTPS ở production");
  }

  if (parsed.pathname !== "/api/v1" || parsed.search || parsed.hash) {
    throw new Error(
      '[CONFIG] VITE_API_URL phải kết thúc bằng /api/v1 và không có query/hash: "' +
        candidate +
        '"'
    );
  }

  return candidate;
}

export const API_URL = resolveApiUrl(
  import.meta.env.VITE_API_URL,
  import.meta.env.PROD
);
```

Sửa đầu `frontend/src/api/axiosClient.ts` thành:

```ts
import axios, { type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../config/apiUrl";
```

Xóa dòng khai báo `API_URL` cũ trong `axiosClient.ts`. Giữ nguyên `axios.create({ baseURL: API_URL, ... })`.

- [ ] **Step 5: Chạy test và build**

```powershell
Set-Location frontend
rtk npm test -- src/config/apiUrl.test.ts
rtk npm run typecheck
rtk npm run build
Set-Location ..
```

Expected: 6 test API URL PASS, typecheck PASS, build PASS.

- [ ] **Step 6: Sửa Vercel Production Environment Variable**

Trong Vercel Dashboard:

1. Mở project `final-project-js-ten`.
2. Vào **Settings → Environment Variables**.
3. Chọn `VITE_API_URL` ở môi trường **Production**.
4. Xóa giá trị `https://<link-backend-cua-ban>.onrender.com/api/v1`.
5. Đặt chính xác giá trị `https://learnquiz-api.onrender.com/api/v1`.
6. Chưa redeploy ở bước này; đợi Task 7 để deploy toàn bộ thay đổi một lần.

- [ ] **Step 7: Commit**

```powershell
rtk git add frontend/package.json frontend/package-lock.json frontend/src/config/apiUrl.ts frontend/src/config/apiUrl.test.ts frontend/src/api/axiosClient.ts
rtk git commit -m "fix: validate frontend API URL configuration"
```

---

## Task 2: Thay Gemini model đã ngừng hoạt động

**Files:**

- Create: `backend/tests/env.test.ts`
- Modify: `backend/src/config/env.ts`
- Modify: `backend/.env.example`
- Modify: `docker-compose.full.yml`
- Modify: `render.yaml`
- Modify: `docs/DEPLOY.md`
- Modify: `backend/package.json`
- External: Render service `learnquiz-api`

Model được Google API chỉ định trong lỗi 404 ngày 30/08/2026 là `gemini-3.6-flash`. Dùng cùng một tên ở local, Docker, Render và tài liệu.

- [ ] **Step 1: Viết test đỏ cho default model**

Tạo `backend/tests/env.test.ts`:

```ts
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
delete process.env.GEMINI_MODEL;

import { equal, report, section } from "./helpers/assert";
import { env } from "../src/config/env";

section("Cấu hình Gemini mặc định");
equal("dùng model Gemini còn được hỗ trợ", env.gemini.model, "gemini-3.6-flash");
report("env.test.ts");
```

Thêm suite này vào đầu script `test` trong `backend/package.json`:

```json
"test": "ts-node --transpile-only tests/env.test.ts && ts-node --transpile-only tests/grader.test.ts && ts-node --transpile-only tests/workflow.test.ts && ts-node --transpile-only tests/schema.test.ts && ts-node --transpile-only tests/gemini.test.ts && ts-node --transpile-only tests/quizService.test.ts && ts-node --transpile-only tests/adminService.test.ts && ts-node --transpile-only tests/aiService.test.ts && ts-node --transpile-only tests/api.test.ts"
```

- [ ] **Step 2: Chạy test và xác nhận đỏ**

```powershell
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/env.test.ts
Set-Location ..
```

Expected: FAIL; nhận `gemini-2.0-flash`, mong `gemini-3.6-flash`.

- [ ] **Step 3: Đổi model tại mọi nguồn cấu hình**

Thay `gemini-2.0-flash` bằng `gemini-3.6-flash` tại đúng các file:

```text
backend/src/config/env.ts
backend/.env.example
docker-compose.full.yml
render.yaml
docs/DEPLOY.md
```

Sau khi sửa, cấu hình chính phải là:

```ts
// backend/src/config/env.ts
model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
```

```yaml
# render.yaml
- key: GEMINI_MODEL
  value: gemini-3.6-flash
```

```yaml
# docker-compose.full.yml
GEMINI_MODEL: ${GEMINI_MODEL:-gemini-3.6-flash}
```

- [ ] **Step 4: Xác minh không còn model cũ và test xanh**

```powershell
rtk rg -n "gemini-2\.0-flash" . --hidden -g "!node_modules" -g "!dist" -g "!.git"
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/env.test.ts
rtk npm run typecheck
Set-Location ..
```

Expected: `rg` không có kết quả; test env PASS; typecheck PASS.

- [ ] **Step 5: Chuẩn bị Render nhưng chưa redeploy**

Trong Render Dashboard → `learnquiz-api` → Environment:

- `GEMINI_MODEL=gemini-3.6-flash`
- `GEMINI_API_KEY` phải tồn tại và không rỗng.

Không copy API key vào tài liệu hoặc terminal. Chưa redeploy cho đến Task 7.

- [ ] **Step 6: Commit**

```powershell
rtk git add backend/tests/env.test.ts backend/package.json backend/src/config/env.ts backend/.env.example docker-compose.full.yml render.yaml docs/DEPLOY.md
rtk git commit -m "fix: update supported Gemini model"
```

---

## Task 3: Làm bộ test độc lập với GEMINI_API_KEY của máy

**Files:**

- Modify: `backend/tests/api.test.ts`

- [ ] **Step 1: Tái hiện lỗi với key giả**

```powershell
Set-Location backend
$env:GEMINI_API_KEY = "key-chi-dung-de-test-isolation"
rtk proxy npx ts-node --transpile-only tests/api.test.ts
Remove-Item Env:GEMINI_API_KEY
Set-Location ..
```

Expected trước khi sửa: suite API không đạt 57/57 vì `/ai/status` báo configured và test có thể gọi mạng thật.

- [ ] **Step 2: Cô lập env trước mọi import**

Đặt các dòng sau ở đầu tuyệt đối của `backend/tests/api.test.ts`, trước các import/require hiện có:

```ts
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.GEMINI_API_KEY = "";
process.env.GEMINI_MODEL = "gemini-test-model";
```

Nếu file đã có ba dòng đầu, giữ một bản duy nhất và chỉ bổ sung hai dòng Gemini. Không dùng `delete process.env.GEMINI_API_KEY` vì `dotenv.config()` có thể nạp lại key từ `.env`; chuỗi rỗng cố ý ngăn việc đó.

- [ ] **Step 3: Chạy lại với shell vẫn có key giả**

```powershell
Set-Location backend
$env:GEMINI_API_KEY = "key-chi-dung-de-test-isolation"
rtk proxy npx ts-node --transpile-only tests/api.test.ts
Remove-Item Env:GEMINI_API_KEY
Set-Location ..
```

Expected: `api.test.ts: 57 đạt / 0 hỏng`; không có request mạng tới Google.

- [ ] **Step 4: Commit**

```powershell
rtk git add backend/tests/api.test.ts
rtk git commit -m "test: isolate API suite from Gemini environment"
```

---

## Task 4: Bổ sung điểm quiz trung bình cho Student

**Decision:** Điểm trung bình khóa học được tính từ **điểm tốt nhất của mỗi quiz**. Một học viên làm lại nhiều lần không làm một quiz có trọng số lớn hơn các quiz khác. Chưa làm quiz nào thì API trả `null`, UI hiển thị `Chưa có`.

**Files:**

- Create: `backend/tests/enrollmentService.test.ts`
- Modify: `backend/src/services/enrollmentService.ts`
- Modify: `backend/package.json`
- Modify: `frontend/src/types/lesson.ts`
- Modify: `frontend/src/pages/MyCoursesPage.tsx`

- [ ] **Step 1: Viết test đỏ cho tiến độ và điểm trung bình**

Tạo `backend/tests/enrollmentService.test.ts`:

```ts
import fakePrisma, { db, resetDb } from "./helpers/fakePrisma";
import { equal, report, section } from "./helpers/assert";

const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const enrollmentService = require("../src/services/enrollmentService");

const STUDENT = { id: 4, role: "student" as const };

function seed(): void {
  resetDb();
  db.users.push(
    { id: 2, name: "Giảng viên", role: "instructor", isActive: true },
    { id: 4, name: "Học viên", role: "student", isActive: true }
  );
  db.courses.push(
    { id: 10, title: "JavaScript", instructorId: 2, categoryId: null, status: "published", level: "beginner", createdAt: new Date(), updatedAt: new Date() },
    { id: 11, title: "React", instructorId: 2, categoryId: null, status: "published", level: "intermediate", createdAt: new Date(), updatedAt: new Date() }
  );
  db.lessons.push(
    { id: 100, courseId: 10, title: "Bài 1", order: 1 },
    { id: 101, courseId: 10, title: "Bài 2", order: 2 },
    { id: 110, courseId: 11, title: "Bài 1", order: 1 }
  );
  db.quizzes.push(
    { id: 200, lessonId: 100, title: "Quiz 1", passScore: 70, maxAttempts: null },
    { id: 201, lessonId: 101, title: "Quiz 2", passScore: 70, maxAttempts: null }
  );
  db.enrollments.push(
    { id: 300, studentId: 4, courseId: 10, enrolledAt: new Date() },
    { id: 301, studentId: 4, courseId: 11, enrolledAt: new Date() }
  );
  db.lessonProgress.push(
    { id: 400, enrollmentId: 300, lessonId: 100, isCompleted: true, completedAt: new Date() }
  );
  db.submissions.push(
    { id: 500, studentId: 4, quizId: 200, score: 40, attemptNo: 1 },
    { id: 501, studentId: 4, quizId: 200, score: 80, attemptNo: 2 },
    { id: 502, studentId: 4, quizId: 201, score: 60, attemptNo: 1 }
  );
}

(async () => {
  section("Tiến độ và điểm quiz trung bình của học viên");
  seed();

  const items = await enrollmentService.listMine(STUDENT);
  const javascript = items.find((item: { course: { id: number } }) => item.course.id === 10);
  const react = items.find((item: { course: { id: number } }) => item.course.id === 11);

  equal("trả đủ hai khóa đã đăng ký", items.length, 2);
  equal("tiến độ JavaScript là 1/2 bài", javascript?.progressPercent, 50);
  equal("lấy best attempt từng quiz: (80 + 60) / 2", javascript?.averageQuizScore, 70);
  equal("chưa làm quiz thì điểm trung bình là null", react?.averageQuizScore, null);

  report("enrollmentService.test.ts");
})();
```

Thêm suite vào script `test` của `backend/package.json`, ngay trước `tests/api.test.ts`:

```text
ts-node --transpile-only tests/enrollmentService.test.ts &&
```

- [ ] **Step 2: Chạy test và xác nhận đỏ**

```powershell
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/enrollmentService.test.ts
Set-Location ..
```

Expected: hai assertion `averageQuizScore` FAIL vì field chưa tồn tại.

- [ ] **Step 3: Thay implementation `listMine`**

Trong `backend/src/services/enrollmentService.ts`, thay toàn bộ hàm `listMine` bằng:

```ts
export async function listMine(viewer: Viewer) {
  const [enrollments, submissions] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { studentId: viewer.id },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { include: courseInclude },
        progresses: { where: { isCompleted: true }, select: { lessonId: true } },
      },
    }),
    prisma.quizSubmission.findMany({
      where: { studentId: viewer.id },
      select: {
        quizId: true,
        score: true,
        quiz: { select: { lesson: { select: { courseId: true } } } },
      },
    }),
  ]);

  const bestByCourseAndQuiz = new Map<string, { courseId: number; score: number }>();
  for (const submission of submissions) {
    const courseId = submission.quiz.lesson.courseId;
    const key = `${courseId}:${submission.quizId}`;
    const previous = bestByCourseAndQuiz.get(key);
    if (!previous || submission.score > previous.score) {
      bestByCourseAndQuiz.set(key, { courseId, score: submission.score });
    }
  }

  const scoresByCourse = new Map<number, number[]>();
  for (const { courseId, score } of bestByCourseAndQuiz.values()) {
    const scores = scoresByCourse.get(courseId) ?? [];
    scores.push(score);
    scoresByCourse.set(courseId, scores);
  }

  return enrollments.map((enrollment) => {
    const total = enrollment.course._count.lessons;
    const completed = enrollment.progresses.length;
    const scores = scoresByCourse.get(enrollment.courseId) ?? [];

    return {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      course: enrollment.course,
      completedLessons: completed,
      totalLessons: total,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      averageQuizScore:
        scores.length === 0
          ? null
          : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    };
  });
}
```

- [ ] **Step 4: Chạy test backend**

```powershell
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/enrollmentService.test.ts
rtk npm run typecheck
Set-Location ..
```

Expected: 4/4 PASS và typecheck PASS.

- [ ] **Step 5: Thêm type và UI**

Thêm field vào `EnrollmentWithProgress` trong `frontend/src/types/lesson.ts`:

```ts
export interface EnrollmentWithProgress {
  id: number;
  enrolledAt: string;
  course: CourseListItem;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  averageQuizScore: number | null;
}
```

Trong `frontend/src/pages/MyCoursesPage.tsx`, đặt đoạn sau ngay dưới `LinearProgress`:

```tsx
<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
  Trung bình điểm cao nhất mỗi quiz: {item.averageQuizScore === null ? "Chưa có" : `${item.averageQuizScore}/100`}
</Typography>
```

- [ ] **Step 6: Chạy frontend test/build**

```powershell
Set-Location frontend
rtk npm test
rtk npm run typecheck
rtk npm run build
Set-Location ..
```

Expected: frontend test PASS, typecheck PASS, build PASS.

- [ ] **Step 7: Commit**

```powershell
rtk git add backend/tests/enrollmentService.test.ts backend/src/services/enrollmentService.ts backend/package.json frontend/src/types/lesson.ts frontend/src/pages/MyCoursesPage.tsx
rtk git commit -m "feat: show student average quiz score"
```

---

## Task 5: Không để request treo khi refresh token thất bại

**Files:**

- Create: `frontend/src/api/refreshQueue.ts`
- Create: `frontend/src/api/refreshQueue.test.ts`
- Modify: `frontend/src/api/axiosClient.ts`

- [ ] **Step 1: Viết test đỏ cho queue**

Tạo `frontend/src/api/refreshQueue.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RefreshQueue } from "./refreshQueue";

describe("RefreshQueue", () => {
  it("chạy lại toàn bộ request với token mới", async () => {
    const queue = new RefreshQueue();
    const first = queue.wait(async (token) => `first:${token}`);
    const second = queue.wait(async (token) => `second:${token}`);

    queue.flush("new-token");

    await expect(first).resolves.toBe("first:new-token");
    await expect(second).resolves.toBe("second:new-token");
    expect(queue.size).toBe(0);
  });

  it("reject toàn bộ request khi refresh thất bại", async () => {
    const queue = new RefreshQueue();
    const first = queue.wait(async () => "first");
    const second = queue.wait(async () => "second");
    const error = new Error("refresh failed");

    queue.fail(error);

    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    expect(queue.size).toBe(0);
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận đỏ**

```powershell
Set-Location frontend
rtk npm test -- src/api/refreshQueue.test.ts
Set-Location ..
```

Expected: FAIL vì module `refreshQueue` chưa tồn tại.

- [ ] **Step 3: Tạo queue có cả resolve và reject**

Tạo `frontend/src/api/refreshQueue.ts`:

```ts
interface QueueEntry {
  run: (token: string) => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class RefreshQueue {
  private entries: QueueEntry[] = [];

  get size(): number {
    return this.entries.length;
  }

  wait<T>(run: (token: string) => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.entries.push({
        run,
        resolve: (value) => resolve(value as T),
        reject,
      });
    });
  }

  flush(token: string): void {
    const pending = this.entries.splice(0);
    for (const entry of pending) {
      entry.run(token).then(entry.resolve, entry.reject);
    }
  }

  fail(error: unknown): void {
    const pending = this.entries.splice(0);
    for (const entry of pending) {
      entry.reject(error);
    }
  }
}
```

- [ ] **Step 4: Tích hợp queue vào Axios interceptor**

Trong `frontend/src/api/axiosClient.ts`:

1. Thêm import:

```ts
import { RefreshQueue } from "./refreshQueue";
```

2. Thay khai báo queue cũ:

```ts
let isRefreshing = false;
const refreshQueue = new RefreshQueue();
```

3. Thay nhánh `if (isRefreshing)` bằng:

```ts
if (isRefreshing) {
  return refreshQueue.wait(async (token) => {
    original.headers.Authorization = `Bearer ${token}`;
    return axiosClient(original);
  });
}
```

4. Sau khi lưu token mới thành công, thay `queue.forEach(...)` bằng:

```ts
refreshQueue.flush(newAccess);
```

5. Ở đầu nhánh `catch (e)`, thêm:

```ts
refreshQueue.fail(e);
```

6. Xóa dòng `queue = [];` khỏi `finally`; `finally` chỉ còn:

```ts
finally {
  isRefreshing = false;
}
```

- [ ] **Step 5: Chạy test và build**

```powershell
Set-Location frontend
rtk npm test
rtk npm run typecheck
rtk npm run build
Set-Location ..
```

Expected: 5 frontend tests PASS; typecheck và build PASS.

- [ ] **Step 6: Commit**

```powershell
rtk git add frontend/src/api/refreshQueue.ts frontend/src/api/refreshQueue.test.ts frontend/src/api/axiosClient.ts
rtk git commit -m "fix: reject queued requests when token refresh fails"
```

---

## Task 6: Khóa tài khoản có hiệu lực ngay với access token cũ

**Files:**

- Modify: `backend/src/middleware/authenticate.ts`
- Modify: `backend/tests/api.test.ts`

- [ ] **Step 1: Viết test đỏ cho token cũ sau khi admin khóa user**

Trong section quản trị của `backend/tests/api.test.ts`, ngay sau assertion `quản trị khóa học viên -> 200`, thêm:

```ts
const blockedWithOldToken = await request(
  server,
  "GET",
  "/api/v1/enrollments/me",
  STUDENT_TOKEN
);
ok(
  "access token cũ bị chặn ngay sau khi khóa tài khoản",
  blockedWithOldToken.status === 403 &&
    blockedWithOldToken.raw.includes("Tài khoản đã bị khóa")
);

const lockedStudent = db.users.find((user) => user.id === 4);
if (lockedStudent) lockedStudent.isActive = true;
```

Việc bật lại user ở cuối test giữ cho các test phân quyền Student phía sau vẫn kiểm tra đúng role thay vì bị middleware khóa che mất.

- [ ] **Step 2: Chạy test và xác nhận đỏ**

```powershell
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/api.test.ts
Set-Location ..
```

Expected: assertion mới FAIL vì middleware hiện chỉ verify chữ ký JWT.

- [ ] **Step 3: Thay middleware bằng bản kiểm tra trạng thái DB**

Thay toàn bộ `backend/src/middleware/authenticate.ts` bằng:

```ts
import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma";
import { verifyAccessToken } from "../utils/jwt";
import { AccessTokenPayload, AppError } from "../types/api";

function readPayload(header: string | undefined): AccessTokenPayload {
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Chưa đăng nhập (thiếu Authorization header)");
  }

  try {
    return verifyAccessToken(header.split(" ")[1]);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TokenExpiredError") {
      throw new AppError(401, "Token đã hết hạn");
    }
    throw new AppError(401, "Token không hợp lệ");
  }
}

async function findActiveUser(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, isActive: true },
  });
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  let payload: AccessTokenPayload;
  try {
    payload = readPayload(req.headers.authorization);
  } catch (err) {
    next(err);
    return;
  }

  try {
    const user = await findActiveUser(payload.id);
    if (!user) {
      next(new AppError(401, "Tài khoản không còn tồn tại"));
      return;
    }
    if (!user.isActive) {
      next(new AppError(403, "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên"));
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

export async function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    next();
    return;
  }

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(header.split(" ")[1]);
  } catch {
    next();
    return;
  }

  try {
    const user = await findActiveUser(payload.id);
    if (user?.isActive) {
      req.user = { id: user.id, email: user.email, role: user.role };
    }
    next();
  } catch (err) {
    next(err);
  }
}
```

- [ ] **Step 4: Chạy backend test/typecheck**

```powershell
Set-Location backend
rtk proxy npx ts-node --transpile-only tests/api.test.ts
rtk npm run typecheck
rtk npm test
Set-Location ..
```

Expected: `api.test.ts: 58 đạt / 0 hỏng`; toàn bộ backend test PASS.

- [ ] **Step 5: Commit**

```powershell
rtk git add backend/src/middleware/authenticate.ts backend/tests/api.test.ts
rtk git commit -m "fix: enforce account lock on existing access tokens"
```

---

## Task 7: Siết CI, cập nhật tài liệu và phát hành

**Files:**

- Create: `.github/workflows/production-smoke.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `docs/DE-AN.md`
- Optional regenerated artifacts: `docs/BAO-CAO-DO-AN-LearnQuiz.docx`, `docs/BAO-CAO-DO-AN-LearnQuiz.pdf`

- [ ] **Step 1: Làm npm audit trở thành quality gate**

Trong `.github/workflows/ci.yml`, xóa cả hai dòng:

```yaml
continue-on-error: true
```

Giữ nguyên:

```yaml
run: npm audit --audit-level=high
```

- [ ] **Step 2: Tạo production smoke workflow**

Tạo `.github/workflows/production-smoke.yml`:

```yaml
name: Production smoke

on:
  workflow_dispatch:
  schedule:
    - cron: "17 */6 * * *"

jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Verify backend and frontend bundle
        shell: bash
        run: |
          node --input-type=module <<'NODE'
          const frontend = "https://final-project-js-ten.vercel.app";
          const backend = "https://learnquiz-api.onrender.com";
          const requestTimeoutMs = 60_000;

          const wait = (milliseconds) =>
            new Promise((resolve) => setTimeout(resolve, milliseconds));

          async function fetchWithRetry(url) {
            let lastError;

            for (let attempt = 1; attempt <= 3; attempt += 1) {
              try {
                const response = await fetch(url, {
                  signal: AbortSignal.timeout(requestTimeoutMs),
                });
                if (response.status < 500 || attempt === 3) return response;
                lastError = new Error(`${url} returned ${response.status}`);
              } catch (error) {
                lastError = error;
              }

              await wait(attempt * 5_000);
            }

            throw lastError ?? new Error(`Failed to fetch ${url}`);
          }

          const health = await fetchWithRetry(`${backend}/health`);
          if (!health.ok) throw new Error(`Backend health failed: ${health.status}`);
          const healthBody = await health.json();
          if (healthBody.status !== "ok" || healthBody.db !== "up") {
            throw new Error(`Backend unhealthy: ${JSON.stringify(healthBody)}`);
          }

          const courses = await fetchWithRetry(
            `${backend}/api/v1/courses?page=1&limit=12&sort=newest`,
          );
          if (!courses.ok) throw new Error(`Courses API failed: ${courses.status}`);
          const coursesBody = await courses.json();
          if (!coursesBody.success || !Array.isArray(coursesBody.data)) {
            throw new Error("Courses API returned an invalid envelope");
          }

          const htmlResponse = await fetchWithRetry(frontend);
          if (!htmlResponse.ok) {
            throw new Error(`Frontend failed: ${htmlResponse.status}`);
          }
          const html = await htmlResponse.text();
          const assetPath = html.match(/src="([^"]*\/assets\/index-[^"]+\.js)"/)?.[1];
          if (!assetPath) throw new Error("Cannot locate frontend JavaScript bundle");

          const bundleResponse = await fetchWithRetry(new URL(assetPath, frontend));
          if (!bundleResponse.ok) {
            throw new Error(`Bundle failed: ${bundleResponse.status}`);
          }
          const bundle = await bundleResponse.text();
          if (bundle.includes("<link-backend-cua-ban>")) {
            throw new Error("Frontend bundle still contains backend URL placeholder");
          }
          if (!bundle.includes("https://learnquiz-api.onrender.com/api/v1")) {
            throw new Error("Frontend bundle does not contain the production HTTPS API URL");
          }

          console.log(
            `Smoke passed; ${coursesBody.data.length} published courses visible`,
          );
          NODE
```

- [ ] **Step 3: Sửa tài liệu vận hành**

Trong `README.md` và `docs/DE-AN.md`, thay mô tả cổng PostgreSQL local từ `5432` thành `5433`. Container vẫn dùng port nội bộ `5432`; máy host dùng `5433` theo `docker-compose.yml`.

Sau khi thêm 1 test env, 4 test enrollment và 1 test khóa access token, cập nhật số backend assertion:

```text
318 -> 324
api.test.ts: 57 -> 58
```

Thêm dòng sau vào bảng test trong `docs/DE-AN.md`:

```markdown
| `tests/env.test.ts` | Default cấu hình Gemini production | 1 |
| `tests/enrollmentService.test.ts` | Tiến độ và điểm quiz trung bình của Student | 4 |
```

Chỉnh dòng `tests/api.test.ts` thành 58 và dòng tổng thành 324.

- [ ] **Step 4: Chạy self-review của plan implementation**

```powershell
rtk rg -n "gemini-2\.0-flash|<link-backend-cua-ban>" . --hidden -g "!node_modules" -g "!dist" -g "!.git" -g "!docs/HUONG-DAN-SUA-CHUA-CLAUDE-COWORK.md"
rtk rg -n "PostgreSQL chạy ở cổng `5432`|Postgres tại cổng 5432|318/318" README.md docs
```

Expected: không còn kết quả cần sửa trong các file thuộc phạm vi repository.

- [ ] **Step 5: Chạy toàn bộ quality gate local**

```powershell
Set-Location backend
rtk npm run typecheck
rtk npm test
rtk npm run build
rtk npm audit --audit-level=high
Set-Location ..\frontend
rtk npm test
rtk npm run typecheck
rtk npm run build
rtk npm audit --audit-level=high
Set-Location ..
rtk git status --short --branch
```

Expected:

- Backend: 324/324 assertions PASS.
- Frontend: 10/10 tests PASS.
- Hai typecheck PASS.
- Hai build PASS.
- Hai audit báo 0 vulnerability high/critical.
- Working tree chỉ có các file dự kiến của Task 7 trước khi commit.

- [ ] **Step 6: Cập nhật báo cáo DOCX/PDF**

Nếu bản nộp DOCX/PDF phải phản ánh số test và model mới, dùng skill `/docx` của Claude Cowork để cập nhật `docs/BAO-CAO-DO-AN-LearnQuiz.docx`, sau đó xuất lại `docs/BAO-CAO-DO-AN-LearnQuiz.pdf`. Không chỉnh XML hoặc binary bằng search/replace trực tiếp. Kiểm tra trực quan các trang có bảng test và cấu hình Gemini trước khi commit.

- [ ] **Step 7: Commit Task 7**

```powershell
rtk git add .github/workflows/ci.yml .github/workflows/production-smoke.yml README.md docs/DE-AN.md
rtk git commit -m "chore: add production readiness gates"
```

Nếu DOCX/PDF đã được tái tạo và kiểm tra trực quan, commit riêng:

```powershell
rtk git add docs/BAO-CAO-DO-AN-LearnQuiz.docx docs/BAO-CAO-DO-AN-LearnQuiz.pdf
rtk git commit -m "docs: update graduation report after readiness fixes"
```

- [ ] **Step 8: Dừng để xin phép push và deploy**

Claude Cowork phải trình bày cho người dùng:

- Danh sách commit mới.
- Kết quả backend/frontend test, build và audit.
- Diff tóm tắt.
- Xác nhận Vercel `VITE_API_URL` và Render `GEMINI_MODEL` đã được đặt đúng.

Chỉ sau khi người dùng đồng ý mới chạy:

```powershell
rtk git push -u origin fix/pre-defense-readiness
```

Merge branch vào `main` theo quy trình repository, sau đó redeploy Render và Vercel từ `main`.

- [ ] **Step 9: Smoke test production sau deploy**

Kiểm tra không đăng nhập:

1. `https://learnquiz-api.onrender.com/health` trả HTTP 200 với `status=ok`, `db=up`.
2. `https://learnquiz-api.onrender.com/api/v1/courses?page=1&limit=12&sort=newest` trả `success=true` và danh sách course.
3. `https://final-project-js-ten.vercel.app/courses` không còn `Failed to construct 'URL': Invalid URL` và hiển thị course.
4. Bundle frontend không chứa `<link-backend-cua-ban>`.

Kiểm tra có đăng nhập bằng tài khoản demo:

1. Instructor mở một bài học có nội dung trên 100 ký tự và sinh 1 câu quiz bằng AI.
2. Student làm sai một câu, nộp bài và lấy giải thích AI; response phải thành công, không phải 404/502.
3. Student mở `Khóa học của tôi`; course có quiz đã làm phải hiện `Trung bình điểm cao nhất mỗi quiz: n/100`.
4. Admin khóa Student; request tiếp theo bằng access token cũ phải nhận HTTP 403 ngay.
5. Chạy thủ công workflow `Production smoke`; expected PASS.

---

## Definition of Done

- [ ] Frontend production dùng đúng `https://learnquiz-api.onrender.com/api/v1`.
- [ ] `/courses` production hiển thị dữ liệu từ backend.
- [ ] Không còn chuỗi `gemini-2.0-flash` hoặc `<link-backend-cua-ban>` trong source/bundle production.
- [ ] Ba tính năng Gemini hoạt động bằng request thật.
- [ ] Student thấy `% tiến độ` và `điểm quiz trung bình`.
- [ ] Backend đạt 324/324 assertions trong môi trường có hoặc không có shell `GEMINI_API_KEY`.
- [ ] Frontend có 10/10 unit tests PASS.
- [ ] Request chờ refresh token đều reject khi refresh thất bại; không loading vô hạn.
- [ ] User bị khóa nhận 403 ngay với access token cũ.
- [ ] Backend/frontend typecheck, build và audit đều PASS.
- [ ] Production smoke workflow PASS.
- [ ] README, đề án và bản báo cáo nộp phản ánh đúng port, model và số test.
- [ ] Working tree sạch sau commit; không có secret hoặc generated artifact ngoài dự kiến.

## Phạm vi không thực hiện

- Không đổi localStorage sang cookie trong đợt sửa này.
- Không code-split bundle frontend; cảnh báo chunk lớn không chặn tốt nghiệp.
- Không thay đổi quy tắc làm lại quiz sau khi đã đạt.
- Không thay đổi machine-state duyệt khóa học hoặc schema database ngoài field hiện có.
- Không thêm thanh toán, upload video, chat, email hoặc tính năng ngoài đề.

