// ---------- Đề thi cho học viên: KHÔNG có isCorrect ----------

export interface QuizChoicePublic {
  id: number;
  text: string;
}

export interface QuizQuestionPublic {
  id: number;
  text: string;
  order: number;
  choices: QuizChoicePublic[];
}

export interface QuizAttemptSummary {
  id: number;
  score: number;
  attemptNo: number;
  submittedAt: string;
}

export interface StudentQuizView {
  lesson: { id: number; title: string; courseId: number };
  quiz: {
    id: number;
    title: string;
    passScore: number;
    maxAttempts: number | null;
    questionCount: number;
  };
  questions: QuizQuestionPublic[];
  attempts: {
    used: number;
    max: number | null;
    canAttempt: boolean;
    best: QuizAttemptSummary | null;
    last: QuizAttemptSummary | null;
    history: QuizAttemptSummary[];
  };
  /** Giảng viên đang xem thử đề - không nộp bài được. */
  isPreview: boolean;
}

// ---------- Đề đầy đủ cho giảng viên: CÓ isCorrect ----------

export interface QuizChoiceFull {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionFull {
  id: number;
  text: string;
  order: number;
  choices: QuizChoiceFull[];
}

export interface EditorQuiz {
  id: number;
  lessonId: number;
  title: string;
  passScore: number;
  maxAttempts: number | null;
  questions: QuizQuestionFull[];
  _count: { submissions: number };
}

export interface EditorQuizView {
  lesson: { id: number; title: string; courseId: number };
  quiz: EditorQuiz | null;
  /** Đã có người nộp bài -> không sửa được bộ câu hỏi nữa. */
  isLocked: boolean;
}

// ---------- Kết quả bài làm ----------

export interface SubmissionQuestion {
  id: number;
  text: string;
  order: number;
  choices: QuizChoiceFull[];
  selectedChoiceId: number | null;
  isCorrect: boolean;
  aiExplanation: string | null;
}

export interface SubmissionResult {
  submission: {
    id: number;
    quizId: number;
    score: number;
    correctCount: number;
    totalQuestions: number;
    attemptNo: number;
    submittedAt: string;
    passed: boolean;
  };
  quiz: { id: number; title: string; passScore: number; maxAttempts: number | null };
  lesson: { id: number; title: string; courseId: number };
  questions: SubmissionQuestion[];
}

// ---------- Dữ liệu gửi lên ----------

export interface QuizPayload {
  title: string;
  passScore: number;
  maxAttempts: number | null;
  questions: { text: string; choices: { text: string; isCorrect: boolean }[] }[];
}

export interface SubmitAnswer {
  questionId: number;
  choiceId: number | null;
}
