import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  EditorQuiz,
  EditorQuizView,
  QuizAttemptSummary,
  QuizPayload,
  StudentQuizView,
  SubmissionResult,
  SubmitAnswer,
} from "../types/quiz";

export const quizApi = {
  // ---- Học viên ----
  /** Đề thi - phía server đã loại bỏ isCorrect trước khi trả về. */
  getForStudent: (lessonId: number) =>
    axiosClient.get<ApiResponse<StudentQuizView>>(`/lessons/${lessonId}/quiz`),

  /** Nộp bài: chỉ gửi "câu nào chọn đáp án nào", KHÔNG gửi điểm. */
  submit: (quizId: number, answers: SubmitAnswer[]) =>
    axiosClient.post<ApiResponse<SubmissionResult>>(`/quiz/${quizId}/submit`, { answers }),

  getSubmission: (submissionId: number) =>
    axiosClient.get<ApiResponse<SubmissionResult>>(`/submissions/${submissionId}`),

  listMySubmissions: (quizId: number) =>
    axiosClient.get<ApiResponse<QuizAttemptSummary[]>>(`/quiz/${quizId}/submissions/me`),

  // ---- Giảng viên ----
  getForEditor: (lessonId: number) =>
    axiosClient.get<ApiResponse<EditorQuizView>>(`/lessons/${lessonId}/quiz/editor`),

  upsert: (lessonId: number, payload: QuizPayload) =>
    axiosClient.put<ApiResponse<EditorQuiz>>(`/lessons/${lessonId}/quiz`, payload),

  updateMeta: (
    quizId: number,
    payload: { title?: string; passScore?: number; maxAttempts?: number | null }
  ) => axiosClient.patch<ApiResponse<EditorQuiz>>(`/quiz/${quizId}`, payload),

  remove: (quizId: number) => axiosClient.delete<ApiResponse<null>>(`/quiz/${quizId}`),
};
