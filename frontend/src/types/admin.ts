import type { CourseLevel, CourseStatus } from "./course";
import type { UserRole } from "./api";

/** Người dùng trong màn hình quản trị - KHÔNG bao giờ có password / refreshToken. */
export interface AdminUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  _count: { coursesTaught: number; enrollments: number; submissions: number };
}

export interface AdminCourseItem {
  id: number;
  title: string;
  status: CourseStatus;
  level: CourseLevel;
  rejectReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string; slug: string } | null;
  instructor: { id: number; name: string; email: string };
  _count: { lessons: number; enrollments: number };
}

export interface OverviewStats {
  users: { student: number; instructor: number; admin: number; total: number };
  courses: { draft: number; pending: number; published: number; rejected: number; total: number };
  enrollments: number;
  submissions: number;
  /** null khi chưa có lượt nộp bài nào - khác hẳn với 0 điểm. */
  avgScore: number | null;
  topCourses: {
    id: number;
    title: string;
    instructor: { id: number; name: string };
    _count: { enrollments: number; lessons: number };
  }[];
}

export interface QuizStat {
  quizId: number;
  title: string;
  lessonId: number;
  lessonTitle: string;
  lessonOrder: number;
  passScore: number;
  attempts: number;
  uniqueStudents: number;
  avgScore: number | null;
  maxScore: number | null;
  passCount: number;
  passRate: number;
}

export interface StudentStat {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  submissions: number;
  avgScore: number | null;
  bestScore: number | null;
}

export interface CourseStats {
  course: { id: number; title: string; status: CourseStatus; createdAt: string };
  totals: { students: number; lessons: number; quizzes: number; submissions: number };
  progress: { avgPercent: number; completedAll: number };
  classAvgScore: number | null;
  quizzes: QuizStat[];
  students: StudentStat[];
}

export interface AdminCourseFilter {
  status?: CourseStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserFilter {
  role?: UserRole | "";
  search?: string;
  isActive?: string; // "" | "true" | "false"
  page?: number;
  limit?: number;
}
