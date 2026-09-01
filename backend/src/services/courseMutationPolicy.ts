import { AppError, CourseStatus, UserRole } from "../types/api";

interface CourseForMutation {
  id: number;
  instructorId: number;
  status: CourseStatus;
}

interface Viewer {
  id: number;
  role: UserRole;
}

/**
 * Nội dung do giảng viên sửa phải đi lại vòng duyệt. Khóa đang pending được
 * đóng băng để bản admin đang xem không thay đổi dưới chân; khóa published
 * được đưa về draft ngay trong cùng transaction với thay đổi nội dung.
 */
export function mutationState(
  course: CourseForMutation,
  viewer: Viewer
): { status: "draft"; publishedAt: null; rejectReason: null } | null {
  if (viewer.role === "admin") return null;
  if (course.instructorId !== viewer.id) {
    throw new AppError(403, "Bạn chỉ được thao tác trên khóa học do mình tạo");
  }
  if (course.status === "pending") {
    throw new AppError(409, "Khóa học đang chờ duyệt nên không thể chỉnh sửa");
  }
  return course.status === "published"
    ? { status: "draft", publishedAt: null, rejectReason: null }
    : null;
}
