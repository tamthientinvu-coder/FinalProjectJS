import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { AiExplanation, AiQuizDraft, AiStatus, AiSummary } from "../types/ai";

/**
 * Mọi lời gọi AI đều đi qua backend.
 * Frontend KHÔNG bao giờ giữ GEMINI_API_KEY - biến VITE_* nào cũng lộ ra
 * trình duyệt, nên đặt key ở đây là công khai luôn khóa cho cả thế giới.
 */
export const aiApi = {
  getStatus: () => axiosClient.get<ApiResponse<AiStatus>>("/ai/status"),

  generateQuiz: (lessonId: number, payload: { count: number; content?: string }) =>
    axiosClient.post<ApiResponse<AiQuizDraft>>(`/ai/lessons/${lessonId}/generate-quiz`, payload),

  explainAnswer: (submissionId: number, questionId: number) =>
    axiosClient.post<ApiResponse<AiExplanation>>("/ai/explain-answer", { submissionId, questionId }),

  summarizeLesson: (lessonId: number) =>
    axiosClient.post<ApiResponse<AiSummary>>(`/ai/lessons/${lessonId}/summarize`),
};
