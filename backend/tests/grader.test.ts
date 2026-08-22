/**
 * Kiểm thử luật chấm điểm và luật mở khóa bài học.
 * Hai hàm này đều là hàm thuần nên test chạy được mà không cần CSDL.
 *
 * Chạy: npm run test
 */
import { gradeQuiz, isPassed } from "../src/services/quizGrader";
import { computeUnlock } from "../src/services/lessonRules";
import { equal, ok, section, report } from "./helpers/assert";

// Đề 4 câu, mỗi câu 4 đáp án; đáp án đúng luôn là lựa chọn đầu tiên (11, 21, 31, 41)
const QUIZ = [1, 2, 3, 4].map((n) => ({
  id: n * 10,
  choices: [1, 2, 3, 4].map((c) => ({ id: n * 10 + c, isCorrect: c === 1 })),
}));
const answerAll = (ids: (number | null)[]) => QUIZ.map((q, i) => ({ questionId: q.id, choiceId: ids[i] }));

section("Chấm điểm - trường hợp cơ bản");
equal("4/4 đúng -> 100", gradeQuiz(QUIZ, answerAll([11, 21, 31, 41])).score, 100);
equal("3/4 đúng -> 75", gradeQuiz(QUIZ, answerAll([11, 21, 31, 42])).score, 75);
equal("2/4 đúng -> 50", gradeQuiz(QUIZ, answerAll([11, 21, 32, 42])).score, 50);
equal("1/4 đúng -> 25", gradeQuiz(QUIZ, answerAll([11, 22, 32, 42])).score, 25);
equal("0/4 đúng -> 0", gradeQuiz(QUIZ, answerAll([12, 22, 32, 42])).score, 0);

section("Chấm điểm - làm tròn");
const QUIZ3 = QUIZ.slice(0, 3);
equal("1/3 -> 33", gradeQuiz(QUIZ3, [{ questionId: 10, choiceId: 11 }]).score, 33);
equal("2/3 -> 67", gradeQuiz(QUIZ3, [{ questionId: 10, choiceId: 11 }, { questionId: 20, choiceId: 21 }]).score, 67);

section("Chấm điểm - trường hợp biên và chống gian lận");
equal("bỏ trống (null) tính là sai", gradeQuiz(QUIZ, answerAll([11, null, null, null])).correctCount, 1);
equal("thiếu hẳn 3 câu -> tổng vẫn là 4", gradeQuiz(QUIZ, [{ questionId: 10, choiceId: 11 }]).totalQuestions, 4);
equal("chọn đáp án của CÂU KHÁC -> không ăn điểm",
  gradeQuiz(QUIZ, [{ questionId: 10, choiceId: 21 }]).answers[0],
  { questionId: 10, choiceId: null, isCorrect: false });
equal("choiceId bịa ra -> coi như bỏ trống",
  gradeQuiz(QUIZ, [{ questionId: 10, choiceId: 99999 }]).answers[0],
  { questionId: 10, choiceId: null, isCorrect: false });
equal("gửi thừa câu ngoài đề -> bỏ qua",
  gradeQuiz(QUIZ3, [...answerAll([11, 21, 31, 41]).slice(0, 3), { questionId: 777, choiceId: 1 }]).score, 100);
equal("đề rỗng -> 0 chứ không NaN", gradeQuiz([], []).score, 0);
equal("thứ tự bài làm đảo lộn vẫn chấm đúng",
  gradeQuiz(QUIZ, [
    { questionId: 40, choiceId: 41 }, { questionId: 10, choiceId: 11 },
    { questionId: 30, choiceId: 31 }, { questionId: 20, choiceId: 21 },
  ]).score, 100);
equal("mảng answers luôn đủ số câu của đề", gradeQuiz(QUIZ, []).answers.length, 4);

section("Ngưỡng đạt");
ok("70 >= 70 -> đạt", isPassed(70, 70));
ok("69 < 70 -> chưa đạt", !isPassed(69, 70));
ok("0 >= 0 -> đạt", isPassed(0, 0));

section("Mở khóa bài học theo lộ trình");
const LESSONS = [
  { id: 10, order: 1 },
  { id: 20, order: 2 },
  { id: 30, order: 3 },
];
const state = (done: number[], bypass = false) =>
  [10, 20, 30].map((id) => (computeUnlock(LESSONS, new Set(done), bypass).get(id) ? "mở" : "khóa")).join(",");

equal("chưa học gì", state([]), "mở,khóa,khóa");
equal("xong bài 1", state([10]), "mở,mở,khóa");
equal("xong bài 1+2", state([10, 20]), "mở,mở,mở");
equal("xong hết rồi bỏ đánh dấu bài 1", state([20, 30]), "mở,khóa,khóa");
equal("giảng viên xem trước (bypass)", state([], true), "mở,mở,mở");
equal("khóa rỗng không lỗi", computeUnlock([], new Set(), false).size, 0);

report("grader.test.ts");
