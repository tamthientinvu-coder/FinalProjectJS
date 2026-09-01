/* Kiểm thử tích hợp tầng service với Prisma giả lập tôn trọng select/include. */
import fakePrisma, { db } from "./helpers/fakePrisma";
import { ok, expectError, section, report } from "./helpers/assert";

// Tráo module prisma TRƯỚC khi nạp service
const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true, exports: { default: fakePrisma, __esModule: true },
} as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const quizService = require("../src/services/quizService");


function seed() {
  Object.values(db).forEach((arr) => (arr.length = 0));
  db.courses.push({ id: 1, title: "JavaScript căn bản", instructorId: 2, status: "published" });
  db.lessons.push(
    { id: 1, courseId: 1, title: "Biến và kiểu dữ liệu", order: 1, content: "nội dung 1", videoUrl: null },
    { id: 2, courseId: 1, title: "Hàm và closure", order: 2, content: "nội dung 2", videoUrl: null }
  );
  db.enrollments.push({ id: 100, studentId: 4, courseId: 1 });
  db.quizzes.push({ id: 10, lessonId: 1, title: "Kiểm tra bài 1", passScore: 70, maxAttempts: 3 });
  db.questions.push(
    { id: 1000, quizId: 10, text: "Từ khóa nào không gán lại được?", order: 1 },
    { id: 1001, quizId: 10, text: "let có phạm vi gì?", order: 2 }
  );
  [1000, 1001].forEach((qid, qi) =>
    [1, 2, 3, 4].forEach((c) =>
      db.choices.push({ id: qid * 10 + c, questionId: qid, text: `Đáp án ${c} của câu ${qi + 1}`, isCorrect: c === 1 })
    )
  );
}

const STUDENT = { id: 4, role: "student" as const };
const OTHER_STUDENT = { id: 5, role: "student" as const };
const INSTRUCTOR = { id: 2, role: "instructor" as const };
const ADMIN = { id: 1, role: "admin" as const };

(async () => {
  section("A. RÒ RỈ ĐÁP ÁN — phép thử quan trọng nhất của đề tài");
  seed();
  const view = await quizService.getForStudent(1, STUDENT);
  const raw = JSON.stringify(view);

  ok("response KHÔNG chứa chuỗi \"isCorrect\"", !raw.includes("isCorrect"), `\n      thấy: ${raw.slice(0, 300)}`);
  ok("response KHÔNG chứa \"correct\" (mọi biến thể)", !raw.toLowerCase().includes("correct"));
  ok("mỗi đáp án chỉ có đúng 2 field id + text",
    view.questions.every((q: any) => q.choices.every((c: any) => JSON.stringify(Object.keys(c).sort()) === '["id","text"]')));
  ok("trả đủ 2 câu hỏi", view.questions.length === 2);
  ok("mỗi câu có đủ 4 đáp án", view.questions.every((q: any) => q.choices.length === 4));
  ok("có thông tin lượt làm", view.attempts.used === 0 && view.attempts.canAttempt === true);
  ok("passScore hiển thị cho học viên", view.quiz.passScore === 70);

  section("B. PHÂN QUYỀN XEM ĐỀ");
  await expectError("học viên chưa đăng ký", () => quizService.getForStudent(1, OTHER_STUDENT), 403, "đăng ký khóa học");
  await expectError("bài 2 chưa mở khóa", () => quizService.getForStudent(2, STUDENT), 403, "hoàn thành các bài học trước");

  const teacherView = await quizService.getForStudent(1, INSTRUCTOR);
  ok("giảng viên xem trước: isPreview = true", teacherView.isPreview === true);
  ok("giảng viên xem trước: KHÔNG nộp bài được", teacherView.attempts.canAttempt === false);
  ok("giảng viên xem trước cũng KHÔNG thấy isCorrect", !JSON.stringify(teacherView).includes("isCorrect"));

  await expectError("học viên gọi API dành cho giảng viên", () => quizService.getForEditor(1, STUDENT), 403);
  const editorView = await quizService.getForEditor(1, INSTRUCTOR);
  ok("giảng viên CÓ thấy isCorrect ở endpoint soạn đề", JSON.stringify(editorView).includes("isCorrect"));
  ok("chưa ai nộp bài -> chưa khóa sửa đề", editorView.isLocked === false);

  section("C. NỘP BÀI & CHẤM ĐIỂM");
  seed();
  const r1 = await quizService.submit(10, STUDENT, [
    { questionId: 1000, choiceId: 10001 }, // đúng
    { questionId: 1001, choiceId: 10012 }, // sai
  ]);
  ok("đúng 1/2 -> 50 điểm", r1.submission.score === 50, `nhận ${r1.submission.score}`);
  ok("correctCount = 1", r1.submission.correctCount === 1);
  ok("totalQuestions = 2", r1.submission.totalQuestions === 2);
  ok("lượt làm thứ 1", r1.submission.attemptNo === 1);
  ok("50 < 70 -> chưa đạt", r1.submission.passed === false);
  ok("SAU KHI NỘP mới lộ đáp án đúng", JSON.stringify(r1.questions).includes("isCorrect"));
  ok("đánh dấu đúng câu đã chọn", r1.questions[0].selectedChoiceId === 10001 && r1.questions[0].isCorrect === true);
  ok("đánh dấu đúng câu sai", r1.questions[1].selectedChoiceId === 10012 && r1.questions[1].isCorrect === false);

  const r2 = await quizService.submit(10, STUDENT, [
    { questionId: 1000, choiceId: 10001 },
    { questionId: 1001, choiceId: 10011 },
  ]);
  ok("làm lại -> lượt thứ 2", r2.submission.attemptNo === 2);
  ok("2/2 đúng -> 100 điểm, đạt", r2.submission.score === 100 && r2.submission.passed === true);
  await expectError("đã đạt -> không được thi lại để làm sai lịch sử", () =>
    quizService.submit(10, STUDENT, [{ questionId: 1000, choiceId: null }]), 409, "đã đạt");
  const passedView = await quizService.getForStudent(1, STUDENT);
  ok("đã đạt -> giao diện nhận canAttempt=false", passedView.attempts.canAttempt === false);

  seed();
  db.quizzes[0].maxAttempts = 1;
  await quizService.submit(10, STUDENT, [{ questionId: 1000, choiceId: null }]);
  await expectError("hết 1 lượt chưa đạt -> chặn", () =>
    quizService.submit(10, STUDENT, [{ questionId: 1000, choiceId: 10001 }]), 409, "hết");

  section("D. CHỐNG GIAN LẬN QUA API");
  seed();
  await expectError("gửi câu hỏi của quiz khác",
    () => quizService.submit(10, STUDENT, [{ questionId: 7777, choiceId: 1 }]), 400, "không thuộc quiz");
  const rCross = await quizService.submit(10, STUDENT, [
    { questionId: 1000, choiceId: 10011 }, // đáp án của CÂU 2 gán cho CÂU 1
    { questionId: 1001, choiceId: 10011 }, // đúng
  ]);
  ok("chọn đáp án của câu khác -> không ăn điểm câu đó", rCross.submission.correctCount === 1);
  ok("chọn đáp án của câu khác -> ghi nhận là bỏ trống", rCross.questions[0].selectedChoiceId === null);

  seed();
  await expectError("giảng viên nộp bài", () => quizService.submit(10, INSTRUCTOR, [{ questionId: 1000, choiceId: 10001 }]), 403, "học viên");
  await expectError("người ngoài nộp bài", () => quizService.submit(10, OTHER_STUDENT, [{ questionId: 1000, choiceId: 10001 }]), 403, "đăng ký");

  section("E. XEM LẠI BÀI ĐÃ NỘP");
  seed();
  const sub = await quizService.submit(10, STUDENT, [{ questionId: 1000, choiceId: 10001 }, { questionId: 1001, choiceId: 10011 }]);
  const subId = sub.submission.id;
  ok("chính chủ xem được", (await quizService.getSubmission(subId, STUDENT)).submission.id === subId);
  ok("giảng viên của khóa xem được", (await quizService.getSubmission(subId, INSTRUCTOR)).submission.id === subId);
  ok("admin xem được", (await quizService.getSubmission(subId, ADMIN)).submission.id === subId);
  await expectError("học viên khác KHÔNG xem được", () => quizService.getSubmission(subId, OTHER_STUDENT), 403, "không có quyền");
  await expectError("bài làm không tồn tại", () => quizService.getSubmission(999999, STUDENT), 404);

  section("F. KHÓA SỬA ĐỀ SAU KHI CÓ NGƯỜI NỘP");
  const lockedEditor = await quizService.getForEditor(1, INSTRUCTOR);
  ok("đã có lượt nộp -> isLocked = true", lockedEditor.isLocked === true);
  const q = { text: "Câu hỏi mới thử nghiệm?", choices: [1, 2, 3, 4].map((i) => ({ text: `Đ${i}`, isCorrect: i === 1 })) };
  await expectError("sửa bộ câu hỏi khi đã có bài nộp",
    () => quizService.upsert(1, INSTRUCTOR, { title: "Đề mới", passScore: 70, maxAttempts: null, questions: [q] }), 409, "lượt làm bài");
  await expectError("không đổi điểm đạt sau khi đã có bài nộp",
    () => quizService.updateMeta(10, INSTRUCTOR, { passScore: 60 }), 409, "điểm đạt");
  const meta = await quizService.updateMeta(10, INSTRUCTOR, { title: "Tên mới" });
  ok("vẫn sửa được tên quiz", meta.title === "Tên mới");
  await expectError("không xóa quiz đã có lịch sử",
    () => quizService.remove(10, INSTRUCTOR), 409, "lượt làm bài");
  await expectError("người lạ sửa quiz", () => quizService.updateMeta(10, OTHER_STUDENT, { passScore: 10 }), 403);

  section("G. TẠO QUIZ MỚI");
  seed();
  db.quizzes.length = 0; db.questions.length = 0; db.choices.length = 0;
  const created = await quizService.upsert(1, INSTRUCTOR, {
    title: "Quiz hoàn toàn mới", passScore: 80, maxAttempts: null,
    questions: [q, { ...q, text: "Câu hỏi thứ hai thử nghiệm?" }],
  });
  ok("tạo được quiz mới", created.title === "Quiz hoàn toàn mới");
  ok("lưu đủ 2 câu hỏi", db.questions.length === 2);
  ok("lưu đủ 8 đáp án", db.choices.length === 8);
  ok("đánh số câu hỏi lại từ 1", db.questions.map((x: any) => x.order).join(",") === "1,2");
  await expectError("học viên soạn quiz", () => quizService.upsert(1, STUDENT, { title: "x", passScore: 70, maxAttempts: null, questions: [q] }), 403);

  report("quizService.test.ts");
})().catch((e) => { console.error("LỖI NGOÀI DỰ KIẾN:", e); process.exit(1); });
