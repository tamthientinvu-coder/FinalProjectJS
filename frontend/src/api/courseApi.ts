import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { CourseDetail, CourseFilter, CourseListItem, CoursePayload } from "../types/course";

export const courseApi = {
  /** Danh sách khóa học đã duyệt (công khai). Trả kèm meta phân trang. */
  list: (filter: CourseFilter) =>
    axiosClient.get<ApiResponse<CourseListItem[]>>("/courses", {
      // Bỏ các field rỗng để URL sạch: /courses?page=1 thay vì /courses?category=&level=&page=1
      params: Object.fromEntries(
        Object.entries(filter).filter(([, v]) => v !== "" && v !== undefined && v !== null)
      ),
    }),

  getById: (id: number) => axiosClient.get<ApiResponse<CourseDetail>>(`/courses/${id}`),

  listMine: () => axiosClient.get<ApiResponse<CourseListItem[]>>("/courses/mine"),

  create: (payload: CoursePayload) =>
    axiosClient.post<ApiResponse<CourseListItem>>("/courses", payload),

  update: (id: number, payload: Partial<CoursePayload>) =>
    axiosClient.patch<ApiResponse<CourseListItem>>(`/courses/${id}`, payload),

  submit: (id: number) =>
    axiosClient.post<ApiResponse<CourseListItem>>(`/courses/${id}/submit`),

  remove: (id: number) => axiosClient.delete<ApiResponse<null>>(`/courses/${id}`),
};
