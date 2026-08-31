import prisma from "../utils/prisma";
import { AppError, CourseStatus, UserRole } from "../types/api";
import { canTransition, explainRefusal, nextStatus } from "./courseWorkflow";

interface Viewer {
  id: number;
  role: UserRole;
}

/** Không bao giờ để password / refreshToken rời khỏi server. */
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: { select: { coursesTaught: true, enrollments: true, submissions: true } },
};

const courseInclude = {
  category: { select: { id: true, name: true, slug: true } },
  instructor: { select: { id: true, name: true, email: true } },
  _count: { select: { lessons: true, enrollments: true } },
};

// ============================================================
// DUYỆT KHÓA HỌC
// ============================================================

export interface AdminCourseFilter {
  status?: CourseStatus;
  search?: string;
  page: number;
  limit: number;
}

/** Hàng đợi duyệt. Không lọc trạng thái thì trả về tất cả. */
export async function listCourses(filter: AdminCourseFilter) {
  const { page, limit } = filter;

  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" as const } },
            { instructor: { name: { contains: filter.search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: courseInclude,
      // Khóa chờ duyệt lâu nhất lên đầu: admin xử lý theo thứ tự công bằng
      orderBy: { updatedAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Đếm số khóa học theo từng trạng thái - dùng cho các tab trên giao diện. */
export async function countCoursesByStatus() {
  const rows = await prisma.course.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const result: Record<string, number> = { draft: 0, pending: 0, published: 0, rejected: 0 };
  for (const row of rows) result[row.status] = row._count._all;
  return result;
}

/** Áp dụng một thao tác của máy trạng thái, kèm kiểm tra chuyển trạng thái hợp lệ. */
async function applyTransition(
  courseId: number,
  action: "publish" | "reject" | "unpublish",
  extra: { rejectReason?: string | null }
) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, status: true },
  });
  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  const current = course.status as CourseStatus;
  if (!canTransition(current, action)) {
    throw new AppError(409, explainRefusal(current, action));
  }

  return prisma.course.update({
    where: { id: courseId },
    data: {
      status: nextStatus(action),
      rejectReason: extra.rejectReason ?? null,
      // Chỉ ghi mốc công khai đúng lúc duyệt
      ...(action === "publish" ? { publishedAt: new Date() } : {}),
      ...(action === "unpublish" ? { publishedAt: null } : {}),
    },
    include: courseInclude,
  });
}

export async function publishCourse(courseId: number) {
  return applyTransition(courseId, "publish", { rejectReason: null });
}

export async function rejectCourse(courseId: number, reason: string) {
  return applyTransition(courseId, "reject", { rejectReason: reason });
}

/**
 * Gỡ khóa học đã công khai về bản nháp.
 * Học viên ĐÃ đăng ký vẫn học tiếp được (quyền học dựa trên Enrollment,
 * không dựa trên trạng thái khóa học) - chỉ chặn người mới đăng ký.
 */
export async function unpublishCourse(courseId: number, reason: string) {
  return applyTransition(courseId, "unpublish", { rejectReason: reason });
}

// ============================================================
// QUẢN LÝ NGƯỜI DÙNG
// ============================================================

export interface UserFilter {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

export async function listUsers(filter: UserFilter) {
  const { page, limit } = filter;

  const where = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
    ...(filter.search
      ? {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" as const } },
            { email: { contains: filter.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/**
 * Khóa hoặc mở tài khoản.
 *
 * Hai lớp bảo vệ chống tự khóa mình ra khỏi hệ thống:
 *   1. quản trị viên không khóa được chính tài khoản đang đăng nhập,
 *   2. không khóa được quản trị viên đang hoạt động CUỐI CÙNG.
 * Thiếu một trong hai là hệ thống có thể rơi vào trạng thái không ai quản trị được.
 *
 * Khi khóa, refreshToken bị xóa để phiên đăng nhập không gia hạn được nữa.
 * Middleware xác thực cũng kiểm tra isActive trong CSDL ở mỗi request bảo vệ,
 * vì vậy access token đang cầm bị vô hiệu hóa ngay sau thao tác khóa.
 */
export async function setUserStatus(targetUserId: number, isActive: boolean, actor: Viewer) {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!target) throw new AppError(404, "Không tìm thấy người dùng");

  if (target.id === actor.id) {
    throw new AppError(409, "Bạn không thể tự khóa tài khoản của chính mình");
  }

  if (!isActive && target.role === "admin") {
    const activeAdmins = await prisma.user.count({ where: { role: "admin", isActive: true } });
    if (activeAdmins <= 1) {
      throw new AppError(409, "Không thể khóa quản trị viên đang hoạt động cuối cùng của hệ thống");
    }
  }

  if (target.isActive === isActive) {
    throw new AppError(409, `Tài khoản đã ở trạng thái ${isActive ? "đang hoạt động" : "bị khóa"}`);
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      isActive,
      // Khóa tài khoản -> thu hồi refresh token ngay
      ...(isActive ? {} : { refreshToken: null }),
    },
    select: publicUserSelect,
  });
}

// ============================================================
// THỐNG KÊ TỔNG QUAN
// ============================================================

/**
 * Số liệu tổng quan toàn hệ thống.
 *
 * Dùng groupBy và orderBy theo số lượng quan hệ để CSDL làm phần đếm,
 * thay vì kéo toàn bộ bản ghi về Node rồi đếm bằng JavaScript.
 */
export async function getOverviewStats() {
  const [usersByRole, coursesByStatus, totalEnrollments, totalSubmissions, scoreAgg, topCourses] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.course.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.enrollment.count(),
      prisma.quizSubmission.count(),
      prisma.quizSubmission.aggregate({ _avg: { score: true } }),
      prisma.course.findMany({
        where: { status: "published" },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5,
        select: {
          id: true,
          title: true,
          instructor: { select: { id: true, name: true } },
          _count: { select: { enrollments: true, lessons: true } },
        },
      }),
    ]);

  const users: Record<string, number> = { student: 0, instructor: 0, admin: 0 };
  for (const row of usersByRole) users[row.role] = row._count._all;

  const courses: Record<string, number> = { draft: 0, pending: 0, published: 0, rejected: 0 };
  for (const row of coursesByStatus) courses[row.status] = row._count._all;

  return {
    users: { ...users, total: users.student + users.instructor + users.admin },
    courses: { ...courses, total: courses.draft + courses.pending + courses.published + courses.rejected },
    enrollments: totalEnrollments,
    submissions: totalSubmissions,
    avgScore: scoreAgg._avg.score === null ? null : Math.round(scoreAgg._avg.score),
    topCourses,
  };
}
