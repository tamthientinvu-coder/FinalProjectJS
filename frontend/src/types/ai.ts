export interface AiStatus {
  /** Máy chủ đã cấu hình GEMINI_API_KEY hay chưa. */
  configured: boolean;
}

export interface AiDraftQuestion {
  text: string;
  choices: { text: string; isCorrect: boolean }[];
}

export interface AiQuizDraft {
  lesson: { id: number; title: string; courseId: number };
  questions: AiDraftQuestion[];
  notice: string;
}

export interface AiExplanation {
  questionId: number;
  explanation: string;
  /** true = lấy từ bộ nhớ đệm trong CSDL, không gọi lại Gemini. */
  cached: boolean;
}

export interface AiSummary {
  lesson: { id: number; title: string };
  bullets: string[];
  notice: string;
}
