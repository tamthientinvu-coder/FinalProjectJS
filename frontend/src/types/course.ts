export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "pending" | "published" | "rejected";

/** Nhãn tiếng Việt dùng chung cho toàn bộ giao diện - khai báo một nơi duy nhất. */
export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đang hiển thị",
  rejected: "Bị từ chối",
};

export const STATUS_COLOR: Record<CourseStatus, "default" | "warning" | "success" | "error"> = {
  draft: "default",
  pending: "warning",
  published: "success",
  rejected: "error",
};

export interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: { courses: number };
}

export interface CourseListItem {
  id: number;
  instructorId: number;
  categoryId: number | null;
  title: string;
  description: string | null;
  thumbnail: string | null;
  level: CourseLevel;
  status: CourseStatus;
  rejectReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string; slug: string } | null;
  instructor: { id: number; name: string };
  _count: { lessons: number; enrollments: number };
}

export interface LessonSummary {
  id: number;
  title: string;
  order: number;
  quiz: { id: number } | null;
}

export interface CourseDetail extends CourseListItem {
  lessons: LessonSummary[];
  /** Người đang xem đã đăng ký khóa này chưa (khách chưa đăng nhập luôn là false). */
  isEnrolled: boolean;
  /** Người đang xem là chủ sở hữu khóa học hoặc admin. */
  canManage: boolean;
}

export interface CourseFilter {
  category?: string;
  level?: CourseLevel | "";
  search?: string;
  sort?: "newest" | "oldest" | "title";
  page?: number;
  limit?: number;
}

export interface CoursePayload {
  title: string;
  description?: string;
  thumbnail?: string | null;
  categoryId?: number | null;
  level: CourseLevel;
}
