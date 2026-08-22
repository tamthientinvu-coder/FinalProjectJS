/**
 * Chấm điểm quiz.
 *
 * Tách riêng thành HÀM THUẦN: không đụng cơ sở dữ liệu, không đụng HTTP,
 * cùng đầu vào luôn cho cùng đầu ra. Nhờ vậy toàn bộ luật chấm điểm
 * kiểm thử được độc lập (Module 4, Bài 2 - Testing & Debug) và người đọc
 * chỉ cần nhìn một chỗ là hiểu hết cách tính điểm.
 */

export interface GradableChoice {
  id: number;
  isCorrect: boolean;
}

export interface GradableQuestion {
  id: number;
  choices: GradableChoice[];
}

export interface SubmittedAnswer {
  questionId: number;
  choiceId: number | null;
}

export interface GradedAnswer {
  questionId: number;
  /** Đáp án học viên đã chọn; null = bỏ trống hoặc chọn đáp án không hợp lệ. */
  choiceId: number | null;
  isCorrect: boolean;
}

export interface GradeResult {
  totalQuestions: number;
  correctCount: number;
  /** Thang 0-100, làm tròn về số nguyên. */
  score: number;
  answers: GradedAnswer[];
}

export function gradeQuiz(
  questions: GradableQuestion[],
  submitted: SubmittedAnswer[]
): GradeResult {
  // Bài làm gửi lên có thể thiếu câu, thừa câu, hoặc sai thứ tự.
  // Luôn duyệt theo DANH SÁCH CÂU HỎI THẬT trong đề, không duyệt theo bài làm:
  // học viên bỏ 3 câu không được phép biến đề 5 câu thành đề 2 câu.
  const answerByQuestion = new Map<number, number | null>();
  for (const answer of submitted) {
    answerByQuestion.set(answer.questionId, answer.choiceId ?? null);
  }

  const answers: GradedAnswer[] = questions.map((question) => {
    const selectedId = answerByQuestion.get(question.id) ?? null;

    // Đáp án đã chọn phải thuộc đúng câu hỏi này. Gửi choiceId của câu khác
    // (hoặc id bịa ra) đều bị coi như bỏ trống, không được tính điểm.
    const selected = question.choices.find((c) => c.id === selectedId);

    return {
      questionId: question.id,
      choiceId: selected ? selected.id : null,
      isCorrect: Boolean(selected?.isCorrect),
    };
  });

  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;

  return {
    totalQuestions,
    correctCount,
    // Đề rỗng thì 0 điểm thay vì chia cho 0 ra NaN
    score: totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100),
    answers,
  };
}

/** Đạt hay chưa đạt, so với ngưỡng passScore của quiz. */
export function isPassed(score: number, passScore: number): boolean {
  return score >= passScore;
}
