import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { LearnView, LessonContent, LessonFull, LessonPayload } from "../types/lesson";

export const lessonApi = {
  // ---- Giảng viên ----
  listForEditor: (courseId: number) =>
    axiosClient.get<ApiResponse<LessonFull[]>>(`/courses/${courseId}/lessons`),

  create: (courseId: number, payload: LessonPayload) =>
    axiosClient.post<ApiResponse<LessonFull>>(`/courses/${courseId}/lessons`, payload),

  update: (lessonId: number, payload: Partial<LessonPayload>) =>
    axiosClient.patch<ApiResponse<LessonFull>>(`/lessons/${lessonId}`, payload),

  remove: (lessonId: number) => axiosClient.delete<ApiResponse<null>>(`/lessons/${lessonId}`),

  /** Gửi TOÀN BỘ bài học của khóa kèm thứ tự mới. */
  reorder: (courseId: number, items: { id: number; order: number }[]) =>
    axiosClient.patch<ApiResponse<LessonFull[]>>(`/courses/${courseId}/lessons/reorder`, { items }),

  // ---- Học viên ----
  getLearnView: (courseId: number) =>
    axiosClient.get<ApiResponse<LearnView>>(`/courses/${courseId}/learn`),

  getContent: (lessonId: number) =>
    axiosClient.get<ApiResponse<LessonContent>>(`/lessons/${lessonId}`),

  markComplete: (lessonId: number, isCompleted: boolean) =>
    axiosClient.patch<ApiResponse<LearnView>>(`/lessons/${lessonId}/complete`, { isCompleted }),
};
