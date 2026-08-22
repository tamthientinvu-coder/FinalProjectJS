import type { CourseListItem } from "./course";

/** Bài học ở màn hình soạn bài của giảng viên - có đầy đủ nội dung. */
export interface LessonFull {
  id: number;
  courseId: number;
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  quiz: { id: number; title: string } | null;
}

/** Bài học ở thanh bên màn hình học - KHÔNG kèm nội dung. */
export interface LessonNavItem {
  id: number;
  title: string;
  order: number;
  hasQuiz: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
}

/** Nội dung đầy đủ của bài học đang mở. */
export interface LessonContent {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
  isCompleted: boolean;
  completedAt: string | null;
}

/** Toàn bộ dữ liệu màn hình học bài, lấy trong 1 request. */
export interface LearnView {
  course: {
    id: number;
    title: string;
    instructorId: number;
    status: string;
    thumbnail: string | null;
    level: string;
  };
  isEnrolled: boolean;
  canManage: boolean;
  lessons: LessonNavItem[];
  progress: { completed: number; total: number; percent: number };
}

export interface EnrollmentWithProgress {
  id: number;
  enrolledAt: string;
  course: CourseListItem;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

export interface LessonPayload {
  title: string;
  content?: string;
  videoUrl?: string | null;
  order?: number;
}
