/**
 * Kiểm thử nghiệp vụ AI với Gemini giả lập.
 * Trọng tâm: phân quyền, kiểm duyệt đầu ra của AI, và cơ chế lưu đệm.
 */
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";

import fakePrisma, { db, resetDb } from "./helpers/fakePrisma";
import { ok, equal, expectError, section, report } from "./helpers/assert";

// ---- Thay tầng Prisma ----
const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

// ---- Thay tầng Gemini ----
let jsonReply: unknown = { questions: [] };
let textReply = "";
let callCount = 0;
let lastPrompt = "";

const geminiPath = require.resolve("../src/services/geminiClient");
require.cache[geminiPath] = {
  id: geminiPath, filename: geminiPath, loaded: true,
  exports: {
    __esModule: true,
    isConfigured: () => true,
    generateJson: async (prompt: string) => {
      callCount++;
      lastPrompt = prompt;
      return jsonReply;
    },
    generateText: async (prompt: string) => {
      callCount++;
      lastPrompt = prompt;
      return textReply;
    },
  },
} as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const aiService = require("../src/services/aiService");

const INSTRUCTOR = { id: 2, role: "instructor" as const };
const OTHER_INSTRUCTOR = { id: 3, role: "instructor" as const };
const STUDENT = { id: 4, role: "student" as const };
const OTHER_STUDENT = { id: 5, role: "student" as const };
const ADMIN = { id: 1, role: "admin" as const };

const LONG_CONTENT =
  "JavaScript có ba cách khai báo biến: var, let và const. " +
  "var có phạm vi function scope và bị hoisting nên dễ gây lỗi khó tìm. " +
  "let và const có block scope, chỉ tồn tại trong cặp ngoặc nhọn gần nhất. " +
  "const không cho gán lại giá trị nhưng nếu là object thì vẫn sửa được thuộc tính bên trong. " +
  "Quy tắc thực hành: mặc định dùng const, chỉ đổi sang let khi thật sự cần gán lại.";

function seed() {
  resetDb();
  callCount = 0;
  db.users.push(
    { id: 1, name: "Admin", email: "a@x.vn", role: "admin", isActive: true },
    { id: 2, name: "Giảng viên", email: "gv@x.vn", role: "instructor", isActive: true },
    { id: 4, name: "Học viên", email: "hv@x.vn", role: "student", isActive: true }
  );
  db.courses.push({ id: 10, title: "JS căn bản", instructorId: 2, status: "published" });
  db.lessons.push(
    { id: 100, courseId: 10, title: "Biến và kiểu dữ liệu", order: 1, content: LONG_CONTENT, videoUrl: null },
    { id: 101, courseId: 10, title: "Bài ngắn", order: 2, content: "quá ngắn", videoUrl: null }
  );
  db.enrollments.push({ id: 300, studentId: 4, courseId: 10, enrolledAt: new Date() });
  db.quizzes.push({ id: 200, lessonId: 100, title: "KT bài 1", passScore: 70, maxAttempts: null });
  db.questions.push({ id: 1000, quizId: 200, text: "Từ khóa nào không gán lại được?", order: 1 });
  db.choices.push(
    { id: 10001, questionId: 1000, text: "var", isCorrect: false },
    { id: 10002, questionId: 1000, text: "let", isCorrect: false },
    { id: 10003, questionId: 1000, text: "const", isCorrect: true },
    { id: 10004, questionId: 1000, text: "function", isCorrect: false }
  );
  db.submissions.push({ id: 500, studentId: 4, quizId: 200, score: 0, correctCount: 0, totalQuestions: 1, attemptNo: 1, submittedAt: new Date() });
  db.answers.push({ id: 600, submissionId: 500, questionId: 1000, choiceId: 10001, isCorrect: false, aiExplanation: null });
}

const goodQuestion = (text: string) => ({
  text,
  choices: [
    { text: "Đáp án A", isCorrect: true },
    { text: "Đáp án B", isCorrect: false },
    { text: "Đáp án C", isCorrect: false },
    { text: "Đáp án D", isCorrect: false },
  ],
});

(async () => {
  // ============================================================
  section("A. SINH CÂU HỎI - phân quyền và điều kiện đầu vào");
  seed();
  jsonReply = { questions: [goodQuestion("Từ khóa nào có block scope?")] };

  await expectError("học viên gọi sinh câu hỏi", () => aiService.generateQuizQuestions(100, STUDENT, { count: 5 }), 403, "giảng viên của khóa");
  await expectError("giảng viên khác gọi", () => aiService.generateQuizQuestions(100, OTHER_INSTRUCTOR, { count: 5 }), 403);
  await expectError("bài học không tồn tại", () => aiService.generateQuizQuestions(9999, INSTRUCTOR, { count: 5 }), 404);
  await expectError("nội dung quá ngắn", () => aiService.generateQuizQuestions(101, INSTRUCTOR, { count: 5 }), 400, "quá ngắn");

  const draft = await aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 });
  equal("sinh được 1 câu hỏi", draft.questions.length, 1);
  ok("kèm ghi chú do AI đề xuất", String(draft.notice).includes("AI đề xuất"));
  ok("KHÔNG tự lưu vào cơ sở dữ liệu", db.questions.length === 1, `db có ${db.questions.length} câu hỏi`);
  ok("prompt có kèm nội dung bài học", lastPrompt.includes("var, let và const"));
  ok("prompt yêu cầu đúng 4 đáp án và 1 đáp án đúng",
    lastPrompt.includes("ĐÚNG 4 đáp án") && lastPrompt.includes("ĐÚNG 1 đáp án đúng"));

  const draftPasted = await aiService.generateQuizQuestions(100, INSTRUCTOR, {
    count: 1,
    content: `${LONG_CONTENT} Nội dung mới vừa gõ chưa kịp lưu vào cơ sở dữ liệu.`,
  });
  ok("ưu tiên nội dung đang gõ trên form", lastPrompt.includes("chưa kịp lưu"));
  equal("vẫn trả về câu hỏi", draftPasted.questions.length, 1);

  equal("admin cũng dùng được", (await aiService.generateQuizQuestions(100, ADMIN, { count: 1 })).questions.length, 1);

  // ============================================================
  section("B. KIỂM DUYỆT ĐẦU RA CỦA AI - dùng đúng luật của người dùng");
  seed();

  jsonReply = { questions: [{ text: "Câu hỏi thử nghiệm?", choices: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }, { text: "C", isCorrect: false }] }] };
  await expectError("AI trả 3 đáp án -> chặn", () => aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 }), 422, "đúng 4 đáp án");

  jsonReply = { questions: [{ text: "Câu hỏi thử nghiệm?", choices: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: true }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }] }] };
  await expectError("AI trả 2 đáp án đúng -> chặn", () => aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 }), 422, "đúng 1 đáp án đúng");

  jsonReply = { questions: [{ text: "Câu hỏi thử nghiệm?", choices: [{ text: "A", isCorrect: false }, { text: "B", isCorrect: false }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }] }] };
  await expectError("AI không đánh dấu đáp án đúng -> chặn", () => aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 }), 422);

  jsonReply = { questions: [{ text: "abc", choices: [{ text: "A", isCorrect: true }, { text: "B", isCorrect: false }, { text: "C", isCorrect: false }, { text: "D", isCorrect: false }] }] };
  await expectError("AI trả câu hỏi quá ngắn -> chặn", () => aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 }), 422);

  jsonReply = { questions: [] };
  await expectError("AI trả danh sách rỗng -> chặn", () => aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 }), 422);

  jsonReply = {
    questions: [
      { ...goodQuestion("Câu hỏi hợp lệ số một?"), id: 999, quizId: 777 },
    ],
  };
  const cleaned = await aiService.generateQuizQuestions(100, INSTRUCTOR, { count: 1 });
  equal("field lạ do AI bịa ra bị loại sạch", Object.keys(cleaned.questions[0]).sort(), ["choices", "text"]);

  // ============================================================
  section("C. GIẢI THÍCH ĐÁP ÁN SAI");
  seed();
  textReply = "Bạn chọn var nhưng var vẫn gán lại được. const mới là từ khóa không cho gán lại.";

  await expectError("học viên khác xem lời giải thích", () => aiService.explainWrongAnswer(500, 1000, OTHER_STUDENT), 403, "không có quyền");
  await expectError("câu trả lời không tồn tại", () => aiService.explainWrongAnswer(500, 9999, STUDENT), 404);

  const first = await aiService.explainWrongAnswer(500, 1000, STUDENT);
  equal("lần đầu -> gọi AI thật", first.cached, false);
  ok("trả về nội dung giải thích", String(first.explanation).includes("const"));
  equal("đã lưu vào cơ sở dữ liệu", db.answers[0].aiExplanation, textReply);
  ok("prompt có đáp án đúng và đáp án đã chọn",
    lastPrompt.includes("ĐÁP ÁN ĐÚNG: const") && lastPrompt.includes("HỌC VIÊN ĐÃ CHỌN: var"));

  const callsBefore = callCount;
  const second = await aiService.explainWrongAnswer(500, 1000, STUDENT);
  equal("lần hai -> lấy từ bộ nhớ đệm", second.cached, true);
  equal("KHÔNG gọi lại Gemini (tiết kiệm hạn mức)", callCount, callsBefore);
  equal("nội dung không đổi", second.explanation, textReply);

  equal("admin cũng xem được", (await aiService.explainWrongAnswer(500, 1000, ADMIN)).cached, true);

  // Câu trả lời đúng thì không cần giải thích
  db.answers[0].isCorrect = true;
  db.answers[0].aiExplanation = null;
  await expectError("câu đã trả lời đúng", () => aiService.explainWrongAnswer(500, 1000, STUDENT), 400, "đã trả lời đúng");

  // ============================================================
  section("D. TÓM TẮT BÀI HỌC");
  seed();
  textReply = "- var có function scope và bị hoisting\n- let và const có block scope\n* const không gán lại được\n\n";

  await expectError("người chưa đăng ký khóa", () => aiService.summarizeLesson(100, OTHER_STUDENT), 403, "đăng ký khóa học");
  await expectError("bài quá ngắn", () => aiService.summarizeLesson(101, INSTRUCTOR), 400, "quá ngắn");

  const summary = await aiService.summarizeLesson(100, STUDENT);
  equal("tách đúng 3 gạch đầu dòng", summary.bullets.length, 3);
  equal("bỏ ký tự gạch đầu dòng", summary.bullets[0], "var có function scope và bị hoisting");
  equal("nhận cả dấu sao", summary.bullets[2], "const không gán lại được");
  ok("kèm ghi chú do AI tạo", String(summary.notice).includes("AI"));

  equal("giảng viên xem được dù không đăng ký", (await aiService.summarizeLesson(100, INSTRUCTOR)).bullets.length, 3);

  report("aiService.test.ts");
})().catch((e) => {
  console.error("LỖI NGOÀI DỰ KIẾN:", e);
  process.exit(1);
});
