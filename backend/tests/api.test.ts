/* Kiểm tra bảng định tuyến thật của Express + vòng đời một request qua middleware. */
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.NODE_ENV = "test";
process.env.GEMINI_API_KEY = "";
process.env.GEMINI_MODEL = "gemini-test-model";

import fakePrisma, { db } from "./helpers/fakePrisma";
import { ok, section, report } from "./helpers/assert";
const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true, exports: { default: fakePrisma, __esModule: true },
} as any;

const app = require("../src/app").default;
const http = require("http");
const { signAccessToken } = require("../src/utils/jwt");


// ---- Liệt kê route đã đăng ký ----
function collectRoutes(): string[] {
  const out: string[] = [];
  const walk = (stack: any[], prefix: string) => {
    for (const layer of stack) {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]).map((m) => m.toUpperCase());
        for (const m of methods) out.push(`${m} ${prefix}${layer.route.path}`);
      } else if (layer.name === "router" && layer.handle?.stack) {
        const src = layer.regexp.source
          .replace("^\\/", "/").replace("\\/?(?=\\/|$)", "").replace(/\\\//g, "/").replace(/\$$/, "");
        walk(layer.handle.stack, prefix + (src === "/(?:/)?" ? "" : src));
      }
    }
  };
  walk(app._router.stack, "");
  return out;
}

const routes = collectRoutes();
section("H. BẢNG ĐỊNH TUYẾN THỰC TẾ");
routes.filter((r) => r.includes("quiz") || r.includes("submission") || r.includes("admin") || r.includes("users") || r.includes("stats") || r.includes("publish") || r.includes("reject") || r.includes("ai/")).forEach((r) => console.log("   " + r));

const expected = [
  "GET /api/v1/lessons/:id/quiz",
  "GET /api/v1/lessons/:id/quiz/editor",
  "PUT /api/v1/lessons/:id/quiz",
  "PATCH /api/v1/quiz/:id",
  "DELETE /api/v1/quiz/:id",
  "POST /api/v1/quiz/:id/submit",
  "GET /api/v1/quiz/:id/submissions/me",
  "GET /api/v1/submissions/:id",
  // Sprint 4
  "GET /api/v1/admin/courses",
  "GET /api/v1/admin/stats",
  "GET /api/v1/users/",
  "PATCH /api/v1/users/:id/status",
  "PATCH /api/v1/courses/:id/publish",
  "PATCH /api/v1/courses/:id/reject",
  "PATCH /api/v1/courses/:id/unpublish",
  "GET /api/v1/courses/:id/stats",
  // Sprint 5
  "GET /api/v1/ai/status",
  "POST /api/v1/ai/lessons/:id/generate-quiz",
  "POST /api/v1/ai/explain-answer",
  "POST /api/v1/ai/lessons/:id/summarize",
];
console.log("");
for (const e of expected) ok(`đã đăng ký: ${e}`, routes.includes(e), `\n      có: ${routes.join(" | ")}`);
ok("tổng số endpoint /api/v1", routes.filter((r) => r.startsWith("GET /api/v1") || r.startsWith("POST /api/v1") || r.startsWith("PATCH /api/v1") || r.startsWith("PUT /api/v1") || r.startsWith("DELETE /api/v1")).length >= 25);

// ---- Gọi HTTP thật ----
function seed() {
  Object.values(db).forEach((a: any[]) => (a.length = 0));
  db.users.push(
    { id: 1, name: "Quản trị", email: "admin@x.vn", password: "hash", refreshToken: "rt", role: "admin", isActive: true, createdAt: new Date() },
    { id: 2, name: "Giảng viên", email: "gv@x.vn", password: "hash", refreshToken: "rt", role: "instructor", isActive: true, createdAt: new Date() },
    { id: 4, name: "Học viên", email: "hv@x.vn", password: "hash", refreshToken: "rt", role: "student", isActive: true, createdAt: new Date() },
    { id: 5, name: "Học viên khác", email: "o@x.vn", password: "hash", refreshToken: "rt", role: "student", isActive: true, createdAt: new Date() }
  );
  db.courses.push({ id: 1, title: "JS", instructorId: 2, status: "published" });
  db.courses.push({ id: 2, title: "Khóa chờ duyệt", instructorId: 2, status: "pending", rejectReason: null, publishedAt: null, updatedAt: new Date(), level: "beginner", categoryId: null });
  db.lessons.push({
    id: 1, courseId: 1, title: "Bài 1", order: 1, videoUrl: null,
    content: "JavaScript có ba cách khai báo biến là var, let và const. var có phạm vi function scope và bị hoisting nên dễ gây lỗi khó tìm, còn let và const có block scope chỉ tồn tại trong cặp ngoặc nhọn gần nhất.",
  });
  db.enrollments.push({ id: 100, studentId: 4, courseId: 1 });
  db.quizzes.push({ id: 10, lessonId: 1, title: "KT", passScore: 70, maxAttempts: null });
  db.questions.push({ id: 1000, quizId: 10, text: "Câu hỏi 1?", order: 1 });
  [1, 2, 3, 4].forEach((c) => db.choices.push({ id: 1000 * 10 + c, questionId: 1000, text: `Đ${c}`, isCorrect: c === 1 }));
}

function request(server: any, method: string, path: string, token?: string, body?: unknown): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      { host: "127.0.0.1", port: server.address().port, method, path,
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}) } },
      (res: any) => {
        let raw = "";
        res.on("data", (c: any) => (raw += c));
        res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw), raw }); } catch { resolve({ status: res.statusCode, body: null, raw }); } });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  seed();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));

  const studentToken = signAccessToken({ id: 4, email: "s@x.vn", role: "student" });
  const strangerToken = signAccessToken({ id: 5, email: "o@x.vn", role: "student" });

  section("I. GỌI HTTP THẬT QUA TOÀN BỘ CHUỖI MIDDLEWARE");

  const health = await request(server, "GET", "/health");
  ok("GET /health -> 200 ok", health.status === 200 && health.body.status === "ok");

  const noAuth = await request(server, "GET", "/api/v1/lessons/1/quiz");
  ok("không gửi token -> 401", noAuth.status === 401, `nhận ${noAuth.status}`);

  const quizRes = await request(server, "GET", "/api/v1/lessons/1/quiz", studentToken);
  ok("học viên lấy đề -> 200", quizRes.status === 200, `nhận ${quizRes.status}: ${quizRes.raw.slice(0, 200)}`);
  ok("PHẢN HỒI HTTP THẬT không chứa isCorrect", !quizRes.raw.includes("isCorrect"), `\n      body: ${quizRes.raw.slice(0, 400)}`);

  const editorRes = await request(server, "GET", "/api/v1/lessons/1/quiz/editor", studentToken);
  ok("học viên gọi endpoint soạn đề -> 403", editorRes.status === 403, `nhận ${editorRes.status}`);

  const badId = await request(server, "GET", "/api/v1/lessons/abc/quiz", studentToken);
  ok("id không phải số -> 400", badId.status === 400, `nhận ${badId.status}`);

  const badBody = await request(server, "POST", "/api/v1/quiz/10/submit", studentToken, { answers: [] });
  ok("bài làm rỗng -> 400 kèm thông báo tiếng Việt",
    badBody.status === 400 && String(badBody.raw).includes("Bài làm không được rỗng"), `nhận ${badBody.status}: ${badBody.raw.slice(0,200)}`);

  const dup = await request(server, "POST", "/api/v1/quiz/10/submit", studentToken,
    { answers: [{ questionId: 1000, choiceId: 10001 }, { questionId: 1000, choiceId: 10002 }] });
  ok("trùng câu hỏi -> 400", dup.status === 400, `nhận ${dup.status}`);

  const submitRes = await request(server, "POST", "/api/v1/quiz/10/submit", studentToken, { answers: [{ questionId: 1000, choiceId: 10001 }] });
  ok("nộp bài -> 201 và 100 điểm", submitRes.status === 201 && submitRes.body?.data?.submission?.score === 100,
    `nhận ${submitRes.status}: ${submitRes.raw.slice(0, 200)}`);
  const subId = submitRes.body?.data?.submission?.id;

  const stealer = await request(server, "GET", `/api/v1/submissions/${subId}`, strangerToken);
  ok("người khác xem bài làm -> 403", stealer.status === 403, `nhận ${stealer.status}`);

  const notFound = await request(server, "GET", "/api/v1/khong-ton-tai", studentToken);
  ok("endpoint không tồn tại -> 404", notFound.status === 404, `nhận ${notFound.status}`);

  const massAssign = await request(server, "POST", "/api/v1/quiz/10/submit", studentToken,
    { answers: [{ questionId: 1000, choiceId: 10002 }], score: 100 });
  ok("gửi kèm score=100 -> server VẪN tự chấm ra 0",
    massAssign.status === 201 && massAssign.body?.data?.submission?.score === 0,
    `nhận điểm ${massAssign.body?.data?.submission?.score}`);

  const headers = await new Promise<any>((resolve) => {
    http.get({ host: "127.0.0.1", port: server.address().port, path: "/health" }, (r: any) => { r.resume(); resolve(r.headers); });
  });
  ok("helmet đã bật (có x-content-type-options)", headers["x-content-type-options"] === "nosniff");
  ok("không lộ x-powered-by", headers["x-powered-by"] === undefined);

  section("J. PHÂN QUYỀN QUẢN TRỊ QUA HTTP");
  seed();
  const adminToken = signAccessToken({ id: 1, email: "admin@x.vn", role: "admin" });
  const teacherToken = signAccessToken({ id: 2, email: "gv@x.vn", role: "instructor" });

  const studentToAdmin = await request(server, "GET", "/api/v1/admin/stats", studentToken);
  ok("học viên gọi /admin/stats -> 403", studentToAdmin.status === 403, `nhận ${studentToAdmin.status}`);

  const teacherToAdmin = await request(server, "GET", "/api/v1/admin/courses", teacherToken);
  ok("giảng viên gọi /admin/courses -> 403", teacherToAdmin.status === 403, `nhận ${teacherToAdmin.status}`);

  const teacherToUsers = await request(server, "GET", "/api/v1/users", teacherToken);
  ok("giảng viên gọi /users -> 403", teacherToUsers.status === 403, `nhận ${teacherToUsers.status}`);

  const adminStats = await request(server, "GET", "/api/v1/admin/stats", adminToken);
  ok("quản trị gọi /admin/stats -> 200", adminStats.status === 200, `nhận ${adminStats.status}: ${adminStats.raw.slice(0, 150)}`);

  const usersList = await request(server, "GET", "/api/v1/users", adminToken);
  ok("quản trị xem danh sách người dùng -> 200", usersList.status === 200);
  ok("danh sách người dùng KHÔNG chứa password/refreshToken",
    !usersList.raw.includes("password") && !usersList.raw.includes("refreshToken") && !usersList.raw.includes("hash"),
    `\n      body: ${usersList.raw.slice(0, 300)}`);

  const selfLock = await request(server, "PATCH", "/api/v1/users/1/status", adminToken, { isActive: false });
  ok("quản trị tự khóa mình -> 409", selfLock.status === 409, `nhận ${selfLock.status}`);

  const lockStudent = await request(server, "PATCH", "/api/v1/users/4/status", adminToken, { isActive: false });
  ok("quản trị khóa học viên -> 200", lockStudent.status === 200, `nhận ${lockStudent.status}`);
  const blockedWithOldToken = await request(
    server,
    "GET",
    "/api/v1/enrollments/me",
    studentToken
  );
  ok(
    "access token cũ bị chặn ngay sau khi khóa tài khoản",
    blockedWithOldToken.status === 403 &&
      blockedWithOldToken.raw.includes("Tài khoản đã bị khóa")
  );

  const lockedStudent = db.users.find((user) => user.id === 4);
  if (lockedStudent) lockedStudent.isActive = true;


  const rejectNoReason = await request(server, "PATCH", "/api/v1/courses/2/reject", adminToken, {});
  ok("từ chối KHÔNG kèm lý do -> 400", rejectNoReason.status === 400, `nhận ${rejectNoReason.status}`);

  const rejectShort = await request(server, "PATCH", "/api/v1/courses/2/reject", adminToken, { reason: "ngắn" });
  ok("lý do quá ngắn -> 400", rejectShort.status === 400, `nhận ${rejectShort.status}`);

  const publishOk = await request(server, "PATCH", "/api/v1/courses/2/publish", adminToken);
  ok("quản trị duyệt khóa chờ duyệt -> 200 và status = published",
    publishOk.status === 200 && publishOk.body?.data?.status === "published",
    `nhận ${publishOk.status}: ${publishOk.raw.slice(0, 200)}`);

  const publishAgain = await request(server, "PATCH", "/api/v1/courses/2/publish", adminToken);
  ok("duyệt lại khóa đã công khai -> 409", publishAgain.status === 409, `nhận ${publishAgain.status}`);

  const teacherPublish = await request(server, "PATCH", "/api/v1/courses/2/publish", teacherToken);
  ok("giảng viên tự duyệt khóa của mình -> 403", teacherPublish.status === 403, `nhận ${teacherPublish.status}`);

  const teacherStats = await request(server, "GET", "/api/v1/courses/1/stats", teacherToken);
  ok("giảng viên xem thống kê khóa của mình -> 200", teacherStats.status === 200, `nhận ${teacherStats.status}`);

  const studentStats = await request(server, "GET", "/api/v1/courses/1/stats", studentToken);
  ok("học viên xem thống kê -> 403", studentStats.status === 403, `nhận ${studentStats.status}`);

  section("K. TÍNH NĂNG AI QUA HTTP - suy giảm êm khi thiếu API key");
  seed();
  // Bộ test này KHÔNG đặt GEMINI_API_KEY -> hệ thống phải chạy bình thường,
  // chỉ riêng các endpoint AI báo lỗi rõ ràng thay vì sập.
  const aiStatus = await request(server, "GET", "/api/v1/ai/status", studentToken);
  ok("GET /ai/status -> 200", aiStatus.status === 200, `nhận ${aiStatus.status}`);
  ok("báo đúng là CHƯA cấu hình API key", aiStatus.body?.data?.configured === false,
    `nhận ${JSON.stringify(aiStatus.body?.data)}`);

  const aiNoAuth = await request(server, "POST", "/api/v1/ai/explain-answer", undefined, { submissionId: 1, questionId: 1 });
  ok("gọi AI không token -> 401", aiNoAuth.status === 401, `nhận ${aiNoAuth.status}`);

  const studentGenerate = await request(server, "POST", "/api/v1/ai/lessons/1/generate-quiz", studentToken, { count: 5 });
  ok("học viên gọi sinh câu hỏi -> 403", studentGenerate.status === 403, `nhận ${studentGenerate.status}`);

  const badCount = await request(server, "POST", "/api/v1/ai/lessons/1/generate-quiz", teacherToken, { count: 99 });
  ok("số câu hỏi vượt mức -> 400", badCount.status === 400, `nhận ${badCount.status}`);

  const summarize = await request(server, "POST", "/api/v1/ai/lessons/1/summarize", studentToken);
  ok("thiếu GEMINI_API_KEY -> 503 kèm hướng dẫn, KHÔNG phải 500",
    summarize.status === 503 && String(summarize.raw).includes("GEMINI_API_KEY"),
    `nhận ${summarize.status}: ${summarize.raw.slice(0, 200)}`);

  const stillWorks = await request(server, "GET", "/api/v1/lessons/1/quiz", studentToken);
  ok("phần còn lại của hệ thống VẪN chạy bình thường khi không có AI", stillWorks.status === 200,
    `nhận ${stillWorks.status}`);

  server.close();
  report("api.test.ts");
  process.exit(0);
})().catch((e) => { console.error("LỖI NGOÀI DỰ KIẾN:", e); process.exit(1); });
