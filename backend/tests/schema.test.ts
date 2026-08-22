/**
 * Kiểm thử tầng validate (Yup): luật ra đề, luật nộp bài,
 * và khả năng chống mass-assignment của stripUnknown.
 */
import { upsertQuizSchema, submitQuizSchema, updateQuizMetaSchema } from "../src/schemas/quizSchema";
import {
  userQuerySchema,
  adminCourseQuerySchema,
  rejectCourseSchema,
  updateUserStatusSchema,
} from "../src/schemas/adminSchema";
import { equal, ok, section, report } from "./helpers/assert";

const choices = (correctIndexes: number[]) =>
  [0, 1, 2, 3].map((i) => ({ text: `Đáp án ${i + 1}`, isCorrect: correctIndexes.includes(i) }));
const goodQuestion = { text: "Từ khóa nào không gán lại được?", choices: choices([2]) };

async function expectValid(name: string, payload: unknown, shouldPass: boolean) {
  try {
    await upsertQuizSchema.validate(payload, { abortEarly: false, stripUnknown: true });
    ok(name, shouldPass, "-> đáng lẽ phải bị chặn");
  } catch (e) {
    const err = e as { errors: string[] };
    ok(`${name}${shouldPass ? "" : ` (chặn: ${err.errors[0]})`}`, !shouldPass, `-> ${err.errors}`);
  }
}

async function expectSubmit(name: string, payload: unknown, shouldPass: boolean) {
  try {
    await submitQuizSchema.validate(payload, { abortEarly: false, stripUnknown: true });
    ok(name, shouldPass, "-> đáng lẽ phải bị chặn");
  } catch (e) {
    const err = e as { errors: string[] };
    ok(`${name}${shouldPass ? "" : ` (chặn: ${err.errors[0]})`}`, !shouldPass, `-> ${err.errors}`);
  }
}

(async () => {
  section("Luật ra đề quiz");
  await expectValid("đúng 4 đáp án, 1 đáp án đúng", { title: "Kiểm tra bài 1", questions: [goodQuestion] }, true);
  await expectValid("chỉ có 3 đáp án", { title: "Kiểm tra", questions: [{ text: "Câu hỏi thử nghiệm?", choices: choices([0]).slice(0, 3) }] }, false);
  await expectValid("không đánh dấu đáp án đúng", { title: "Kiểm tra", questions: [{ text: "Câu hỏi thử nghiệm?", choices: choices([]) }] }, false);
  await expectValid("đánh dấu 2 đáp án đúng", { title: "Kiểm tra", questions: [{ text: "Câu hỏi thử nghiệm?", choices: choices([0, 1]) }] }, false);
  await expectValid("quiz không có câu hỏi nào", { title: "Kiểm tra", questions: [] }, false);
  await expectValid("điểm đạt 150", { title: "Kiểm tra", passScore: 150, questions: [goodQuestion] }, false);
  await expectValid("số lượt làm = 0", { title: "Kiểm tra", maxAttempts: 0, questions: [goodQuestion] }, false);
  await expectValid("số lượt làm null = không giới hạn", { title: "Kiểm tra", maxAttempts: null, questions: [goodQuestion] }, true);
  await expectValid("tên quiz quá ngắn", { title: "ab", questions: [goodQuestion] }, false);
  await expectValid("câu hỏi quá ngắn", { title: "Kiểm tra", questions: [{ text: "abc", choices: choices([0]) }] }, false);

  section("Luật nộp bài");
  await expectSubmit("bài làm bình thường", { answers: [{ questionId: 10, choiceId: 11 }, { questionId: 20, choiceId: 22 }] }, true);
  await expectSubmit("bỏ trống một câu (choiceId null)", { answers: [{ questionId: 10, choiceId: null }] }, true);
  await expectSubmit("trùng questionId", { answers: [{ questionId: 10, choiceId: 11 }, { questionId: 10, choiceId: 12 }] }, false);
  await expectSubmit("mảng rỗng", { answers: [] }, false);
  await expectSubmit("questionId âm", { answers: [{ questionId: -1, choiceId: 11 }] }, false);

  section("Chống mass-assignment");
  const cleaned = await upsertQuizSchema.validate(
    { title: "Kiểm tra", questions: [goodQuestion], lessonId: 999, id: 5, submissions: [] },
    { stripUnknown: true }
  );
  equal("field lạ bị loại sạch", Object.keys(cleaned).sort(), ["maxAttempts", "passScore", "questions", "title"]);

  const meta = await updateQuizMetaSchema.validate({ passScore: 80, questions: [goodQuestion] }, { stripUnknown: true });
  equal("sửa thông tin chung không nhận được questions", Object.keys(meta), ["passScore"]);

  // ============================================================
  section("Bộ lọc quản trị - giá trị từ query string luôn là chuỗi");

  const uq = (input: unknown) => userQuerySchema.validate(input, { stripUnknown: true });
  equal("không tham số -> giá trị mặc định", await uq({}), { limit: 10, page: 1 });
  equal('isActive="true" -> boolean true', (await uq({ isActive: "true" })).isActive, true);
  equal('isActive="false" -> boolean false', (await uq({ isActive: "false" })).isActive, false);
  equal('isActive="" -> bỏ lọc (undefined)', (await uq({ isActive: "" })).isActive, undefined);
  equal('role="" -> bỏ lọc', (await uq({ role: "" })).role, undefined);
  equal('page="3" -> số 3', (await uq({ page: "3" })).page, 3);
  try {
    await uq({ role: "hacker" });
    ok('role="hacker" bị chặn', false);
  } catch (e) {
    ok(`role="hacker" bị chặn (${(e as { errors: string[] }).errors[0]})`, true);
  }

  const cq = (input: unknown) => adminCourseQuerySchema.validate(input, { stripUnknown: true });
  equal('status="" -> bỏ lọc', (await cq({ status: "" })).status, undefined);
  equal('status="pending" -> giữ nguyên', (await cq({ status: "pending" })).status, "pending");
  try {
    await cq({ status: "all" });
    ok('status="all" bị chặn (giao diện phải quy đổi sang chuỗi rỗng)', false);
  } catch {
    ok('status="all" bị chặn (giao diện phải quy đổi sang chuỗi rỗng)', true);
  }

  section("Bắt buộc nêu lý do khi từ chối / gỡ khóa học");
  try {
    await rejectCourseSchema.validate({});
    ok("từ chối không lý do bị chặn", false);
  } catch (e) {
    ok(`từ chối không lý do bị chặn (${(e as { errors: string[] }).errors[0]})`, true);
  }
  try {
    await rejectCourseSchema.validate({ reason: "ngắn" });
    ok("lý do dưới 10 ký tự bị chặn", false);
  } catch {
    ok("lý do dưới 10 ký tự bị chặn", true);
  }
  equal(
    "lý do hợp lệ được giữ nguyên",
    (await rejectCourseSchema.validate({ reason: "Nội dung còn sơ sài, cần bổ sung ví dụ" })).reason,
    "Nội dung còn sơ sài, cần bổ sung ví dụ"
  );

  try {
    await updateUserStatusSchema.validate({ isActive: "abc" });
    ok("isActive không phải boolean bị chặn", false);
  } catch (e) {
    ok(`isActive không phải boolean bị chặn (${(e as { errors: string[] }).errors[0]})`, true);
  }

  report("schema.test.ts");
})();
