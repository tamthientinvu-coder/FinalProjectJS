import prisma from "../utils/prisma";
import { AppError, UserRole } from "../types/api";

interface Viewer {
  id: number;
  role: UserRole;
}

const courseInclude = {
  category: { select: { id: true, name: true, slug: true } },
  instructor: { select: { id: true, name: true } },
  _count: { select: { lessons: true, enrollments: true } },
};

/** Đăng ký học một khóa miễn phí. */
export async function enroll(courseId: number, viewer: Viewer) {
  if (viewer.role !== "student") {
    throw new AppError(403, "Chỉ học viên mới được đăng ký khóa học");
  }
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, status: true, instructorId: true },
  });
  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  if (course.status !== "published") {
    throw new AppError(409, "Khóa học chưa được duyệt nên chưa thể đăng ký");
  }
  if (course.instructorId === viewer.id) {
    throw new AppError(409, "Bạn là giảng viên của khóa học này, không cần đăng ký học");
  }

  const existed = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: viewer.id, courseId } },
    select: { id: true },
  });
  if (existed) {
    throw new AppError(409, "Bạn đã đăng ký khóa học này rồi");
  }

  return prisma.enrollment.create({
    data: { studentId: viewer.id, courseId },
    include: { course: { include: courseInclude } },
  });
}

/**
 * Khóa học tôi đã đăng ký, kèm phần trăm tiến độ và điểm tốt nhất trung bình
 * của từng quiz. Mỗi quiz có trọng số như nhau dù học viên làm lại nhiều lần.
 */
export async function listMine(viewer: Viewer) {
  if (viewer.role !== "student") {
    throw new AppError(403, "Chỉ học viên mới có danh sách khóa học đang học");
  }
  const [enrollments, submissions] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { studentId: viewer.id },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { include: courseInclude },
        progresses: { where: { isCompleted: true }, select: { lessonId: true } },
      },
    }),
    prisma.quizSubmission.findMany({
      where: { studentId: viewer.id },
      select: {
        quizId: true,
        score: true,
        quiz: { select: { lesson: { select: { courseId: true } } } },
      },
    }),
  ]);

  const bestByCourseAndQuiz = new Map<string, { courseId: number; score: number }>();
  for (const submission of submissions) {
    const courseId = submission.quiz.lesson.courseId;
    const key = `${courseId}:${submission.quizId}`;
    const previous = bestByCourseAndQuiz.get(key);
    if (!previous || submission.score > previous.score) {
      bestByCourseAndQuiz.set(key, { courseId, score: submission.score });
    }
  }

  const scoresByCourse = new Map<number, number[]>();
  for (const { courseId, score } of bestByCourseAndQuiz.values()) {
    const scores = scoresByCourse.get(courseId) ?? [];
    scores.push(score);
    scoresByCourse.set(courseId, scores);
  }

  return enrollments.map((enrollment) => {
    const total = enrollment.course._count.lessons;
    const completed = enrollment.progresses.length;
    const scores = scoresByCourse.get(enrollment.courseId) ?? [];

    return {
      id: enrollment.id,
      enrolledAt: enrollment.enrolledAt,
      course: enrollment.course,
      completedLessons: completed,
      totalLessons: total,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      averageQuizScore:
        scores.length === 0
          ? null
          : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    };
  });
}
