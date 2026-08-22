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

/**
 * Đăng ký học một khóa miễn phí.
 *
 * Ba điều kiện, kiểm tra theo đúng thứ tự này để thông báo lỗi sát nghĩa nhất:
 *   1. khóa học phải đã được duyệt (published),
 *   2. không phải khóa do chính mình dạy,
 *   3. chưa đăng ký trước đó.
 */
export async function enroll(courseId: number, viewer: Viewer) {
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

  // Ràng buộc @@unique([studentId, courseId]) là lưới an toàn cuối cùng:
  // nếu người dùng bấm hai lần thật nhanh, request thứ hai sẽ dính P2002
  // và errorHandler tự chuyển thành HTTP 409.
  return prisma.enrollment.create({
    data: { studentId: viewer.id, courseId },
    include: { course: { include: courseInclude } },
  });
}

/**
 * Khóa học tôi đã đăng ký, kèm phần trăm tiến độ.
 *
 * Lấy sẵn danh sách bài đã hoàn thành trong CÙNG một truy vấn (include)
 * thay vì lặp từng khóa rồi gọi count - tránh vấn đề N+1 query.
 */
export async function listMine(viewer: Viewer) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: viewer.id },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: { include: courseInclude },
      progresses: { where: { isCompleted: true }, select: { lessonId: true } },
    },
  });

  return enrollments.map((e) => {
    const total = e.course._count.lessons;
    const completed = e.progresses.length;
    return {
      id: e.id,
      enrolledAt: e.enrolledAt,
      course: e.course,
      completedLessons: completed,
      totalLessons: total,
      // Khóa chưa có bài học nào thì coi như 0%, tránh chia cho 0
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });
}
