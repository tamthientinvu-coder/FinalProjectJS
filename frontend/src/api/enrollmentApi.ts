import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { EnrollmentWithProgress } from "../types/lesson";

export const enrollmentApi = {
  enroll: (courseId: number) =>
    axiosClient.post<ApiResponse<{ id: number }>>(`/courses/${courseId}/enroll`),

  listMine: () => axiosClient.get<ApiResponse<EnrollmentWithProgress[]>>("/enrollments/me"),
};
