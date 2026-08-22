import axiosClient from "./axiosClient";
import type { ApiResponse, PageMeta } from "../types/api";
import type {
  AdminCourseFilter,
  AdminCourseItem,
  AdminUser,
  CourseStats,
  OverviewStats,
  UserFilter,
} from "../types/admin";

/** Bỏ field rỗng để URL sạch: /admin/courses?page=1 thay vì ?status=&search=&page=1 */
function clean<T extends object>(filter: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== "" && v !== undefined && v !== null)
  );
}

/** Danh sách khóa học kèm số đếm theo trạng thái để hiển thị trên các tab. */
export interface AdminCourseListResponse {
  success: boolean;
  data: AdminCourseItem[];
  meta?: PageMeta;
  counts: Record<string, number>;
}

export const adminApi = {
  // ---- Duyệt khóa học ----
  listCourses: (filter: AdminCourseFilter) =>
    axiosClient.get<AdminCourseListResponse>("/admin/courses", { params: clean(filter) }),

  publishCourse: (id: number) =>
    axiosClient.patch<ApiResponse<AdminCourseItem>>(`/courses/${id}/publish`),

  rejectCourse: (id: number, reason: string) =>
    axiosClient.patch<ApiResponse<AdminCourseItem>>(`/courses/${id}/reject`, { reason }),

  unpublishCourse: (id: number, reason: string) =>
    axiosClient.patch<ApiResponse<AdminCourseItem>>(`/courses/${id}/unpublish`, { reason }),

  // ---- Người dùng ----
  listUsers: (filter: UserFilter) =>
    axiosClient.get<ApiResponse<AdminUser[]>>("/users", { params: clean(filter) }),

  setUserStatus: (id: number, isActive: boolean) =>
    axiosClient.patch<ApiResponse<AdminUser>>(`/users/${id}/status`, { isActive }),

  // ---- Thống kê ----
  getOverviewStats: () => axiosClient.get<ApiResponse<OverviewStats>>("/admin/stats"),

  getCourseStats: (courseId: number) =>
    axiosClient.get<ApiResponse<CourseStats>>(`/courses/${courseId}/stats`),
};
