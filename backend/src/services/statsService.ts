import prisma from "../utils/prisma";
import { AppError, UserRole } from "../types/api";

interface Viewer {
  id: number;
  role: UserRole;
}

/** Làm tròn về số nguyên, giữ null nếu chưa có dữ liệu (khác với 0 điểm). */
function roundOrNull(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Math.round(value);
}

function percent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

/**
 * Thống kê một khóa học cho giảng viên sở hữu (và admin).
 *
 * Nguyên tắc về hiệu năng: KHÔNG lặp từng học viên rồi gọi truy vấn con.
 * Toàn bộ số liệu điểm lấy bằng hai lệnh groupBy - một theo quiz,
 * một theo học viên - rồi ghép lại trong bộ nhớ. Số truy vấn không đổi
 * dù lớp có 10 hay 10.000 học viên (tránh vấn đề N+1).
 */
export async function getCourseStats(courseId: number, viewer: Viewer) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, status: true, instructorId: true, createdAt: true },
  });
  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  if (viewer.role !== "admin" && course.instructorId !== viewer.id) {
    throw new AppError(403, "Bạn chỉ xem được thống kê của khóa học do mình tạo");
  }

  // ---------- Bài học và quiz ----------
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      order: true,
      quiz: { select: { id: true, title: true, passScore: true } },
    },
  });

  const quizzes = lessons
    .filter((l) => l.quiz !== null)
    .map((l) => ({ ...l.quiz!, lessonId: l.id, lessonTitle: l.title, lessonOrder: l.order }));
  const quizIds = quizzes.map((q) => q.id);

  // ---------- Học viên và tiến độ ----------
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true,
      enrolledAt: true,
      student: { select: { id: true, name: true, email: true, isActive: true } },
      progresses: { where: { isCompleted: true }, select: { lessonId: true } },
    },
  });

  // ---------- Số liệu điểm: hai lệnh groupBy, không phụ thuộc sĩ số ----------
  const [byQuiz, byStudent, byQuizStudent, passCounts] = await Promise.all([
    quizIds.length
      ? prisma.quizSubmission.groupBy({
          by: ["quizId"],
          where: { quizId: { in: quizIds } },
          _count: { _all: true },
          _avg: { score: true },
          _max: { score: true },
        })
      : Promise.resolve([]),
    quizIds.length
      ? prisma.quizSubmission.groupBy({
          by: ["studentId"],
          where: { quizId: { in: quizIds } },
          _count: { _all: true },
          _avg: { score: true },
          _max: { score: true },
        })
      : Promise.resolve([]),
    quizIds.length
      ? prisma.quizSubmission.groupBy({
          by: ["quizId", "studentId"],
          where: { quizId: { in: quizIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    // Ngưỡng đạt khác nhau theo từng quiz nên phải đếm riêng từng quiz
    Promise.all(
      quizzes.map((q) =>
        prisma.quizSubmission.count({ where: { quizId: q.id, score: { gte: q.passScore } } })
      )
    ),
  ]);

  const quizAgg = new Map(byQuiz.map((r) => [r.quizId, r]));
  const studentAgg = new Map(byStudent.map((r) => [r.studentId, r]));

  const uniqueStudentsPerQuiz = new Map<number, number>();
  for (const row of byQuizStudent) {
    uniqueStudentsPerQuiz.set(row.quizId, (uniqueStudentsPerQuiz.get(row.quizId) ?? 0) + 1);
  }

  // ---------- Ghép kết quả ----------
  const totalLessons = lessons.length;

  const students = enrollments.map((e) => {
    const completed = e.progresses.length;
    const agg = studentAgg.get(e.student.id);
    return {
      id: e.student.id,
      name: e.student.name,
      email: e.student.email,
      isActive: e.student.isActive,
      enrolledAt: e.enrolledAt,
      completedLessons: completed,
      totalLessons,
      progressPercent: percent(completed, totalLessons),
      submissions: agg?._count._all ?? 0,
      avgScore: roundOrNull(agg?._avg.score),
      bestScore: agg?._max.score ?? null,
    };
  });

  const quizStats = quizzes.map((q, index) => {
    const agg = quizAgg.get(q.id);
    const attempts = agg?._count._all ?? 0;
    return {
      quizId: q.id,
      title: q.title,
      lessonId: q.lessonId,
      lessonTitle: q.lessonTitle,
      lessonOrder: q.lessonOrder,
      passScore: q.passScore,
      attempts,
      uniqueStudents: uniqueStudentsPerQuiz.get(q.id) ?? 0,
      avgScore: roundOrNull(agg?._avg.score),
      maxScore: agg?._max.score ?? null,
      passCount: passCounts[index],
      passRate: percent(passCounts[index], attempts),
    };
  });

  const totalSubmissions = quizStats.reduce((sum, q) => sum + q.attempts, 0);
  const weightedScoreSum = quizStats.reduce(
    (sum, q) => sum + (q.avgScore ?? 0) * q.attempts,
    0
  );

  return {
    course: { id: course.id, title: course.title, status: course.status, createdAt: course.createdAt },
    totals: {
      students: enrollments.length,
      lessons: totalLessons,
      quizzes: quizzes.length,
      submissions: totalSubmissions,
    },
    progress: {
      avgPercent:
        enrollments.length === 0
          ? 0
          : Math.round(students.reduce((s, st) => s + st.progressPercent, 0) / enrollments.length),
      // Số học viên đã hoàn thành 100% bài học
      completedAll: students.filter((s) => totalLessons > 0 && s.completedLessons === totalLessons).length,
    },
    // Điểm trung bình lớp = trung bình của TẤT CẢ lượt làm bài trong khóa
    classAvgScore: totalSubmissions === 0 ? null : Math.round(weightedScoreSum / totalSubmissions),
    quizzes: quizStats,
    students,
  };
}
