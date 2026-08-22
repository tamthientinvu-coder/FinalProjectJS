import prisma from "../utils/prisma";
import { AppError, CourseLevel, CourseStatus, UserRole } from "../types/api";
import { canTransition, explainRefusal, nextStatus } from "./courseWorkflow";

/** Thông tin kèm theo dùng chung cho danh sách khóa học. */
const listInclude = {
  category: { select: { id: true, name: true, slug: true } },
  instructor: { select: { id: true, name: true } },
  _count: { select: { lessons: true, enrollments: true } },
};

export interface CourseFilter {
  category?: string;
  level?: CourseLevel;
  search?: string;
  sort: "newest" | "oldest" | "title";
  page: number;
  limit: number;
}

function orderByOf(sort: CourseFilter["sort"]) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "title") return { title: "asc" as const };
  return { createdAt: "desc" as const };
}

/**
 * Danh sách khóa học công khai.
 * LUÔN cố định status = published: khóa học nháp hoặc đang chờ duyệt
 * không bao giờ được lọt ra ngoài, kể cả khi client tự thêm query lạ.
 */
export async function listPublished(filter: CourseFilter) {
  const { page, limit } = filter;

  const where = {
    status: "published" as const,
    ...(filter.category ? { category: { slug: filter.category } } : {}),
    ...(filter.level ? { level: filter.level } : {}),
    ...(filter.search
      ? {
          OR: [
            { title: { contains: filter.search, mode: "insensitive" as const } },
            { description: { contains: filter.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // $transaction để count và findMany đọc trên cùng một ảnh chụp dữ liệu
  // -> tổng số trang không bị lệch khi có người thêm khóa học xen giữa.
  const [total, items] = await prisma.$transaction([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      include: listInclude,
      orderBy: orderByOf(filter.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** Khóa học của chính giảng viên đang đăng nhập - mọi trạng thái. */
export async function listMine(instructorId: number) {
  return prisma.course.findMany({
    where: { instructorId },
    include: listInclude,
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Chi tiết khóa học.
 * Khóa chưa published chỉ chủ sở hữu và admin xem được.
 * Nội dung bài học (content, videoUrl) KHÔNG trả ở đây - mở khóa ở Sprint 2
 * sau khi kiểm tra học viên đã enroll.
 */
export async function getById(id: number, viewer?: { id: number; role: UserRole }) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      ...listInclude,
      lessons: {
        select: { id: true, title: true, order: true, quiz: { select: { id: true } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  const isOwner = viewer?.id === course.instructorId;
  const isAdmin = viewer?.role === "admin";

  if (course.status !== "published" && !isOwner && !isAdmin) {
    // Trả 404 chứ không phải 403: không tiết lộ rằng khóa học này có tồn tại
    throw new AppError(404, "Không tìm thấy khóa học");
  }

  // Giao diện cần biết người đang xem đã đăng ký chưa để đổi nút
  // "Đăng ký học" thành "Vào học". Khách chưa đăng nhập thì luôn là false.
  let isEnrolled = false;
  if (viewer) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: viewer.id, courseId: id } },
      select: { id: true },
    });
    isEnrolled = Boolean(enrollment);
  }

  return { ...course, isEnrolled, canManage: Boolean(isOwner || isAdmin) };
}

/** Chỉ chủ sở hữu hoặc admin mới được thay đổi khóa học. */
async function findAndAssertCanEdit(courseId: number, user: { id: number; role: UserRole }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  if (user.role !== "admin" && course.instructorId !== user.id) {
    throw new AppError(403, "Bạn chỉ được thao tác trên khóa học do mình tạo");
  }
  return course;
}

async function assertCategoryExists(categoryId?: number | null) {
  if (categoryId === undefined || categoryId === null) return;
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new AppError(400, "Danh mục không tồn tại");
}

export async function create(
  instructorId: number,
  input: {
    title: string;
    description?: string;
    thumbnail?: string | null;
    categoryId?: number | null;
    level: CourseLevel;
  }
) {
  await assertCategoryExists(input.categoryId);

  return prisma.course.create({
    data: {
      instructorId,
      title: input.title,
      description: input.description,
      thumbnail: input.thumbnail,
      categoryId: input.categoryId ?? null,
      level: input.level,
      // Khóa học mới LUÔN là bản nháp, không cho client tự đặt status
      status: "draft",
    },
    include: listInclude,
  });
}

export async function update(
  id: number,
  user: { id: number; role: UserRole },
  input: {
    title?: string;
    description?: string | null;
    thumbnail?: string | null;
    categoryId?: number | null;
    level?: CourseLevel;
  }
) {
  await findAndAssertCanEdit(id, user);
  await assertCategoryExists(input.categoryId);

  return prisma.course.update({
    where: { id },
    data: input,
    include: listInclude,
  });
}

/** Giảng viên gửi khóa học đi duyệt: draft | rejected -> pending. */
export async function submitForReview(id: number, user: { id: number; role: UserRole }) {
  const course = await findAndAssertCanEdit(id, user);

  // Luật chuyển trạng thái nằm ở courseWorkflow.ts - dùng chung với admin,
  // không viết lại if/else ở mỗi service.
  if (!canTransition(course.status as CourseStatus, "submit")) {
    throw new AppError(409, explainRefusal(course.status as CourseStatus, "submit"));
  }

  // Không cho gửi duyệt một khóa học rỗng - admin sẽ không có gì để xem
  const lessonCount = await prisma.lesson.count({ where: { courseId: id } });
  if (lessonCount === 0) {
    throw new AppError(400, "Khóa học phải có ít nhất 1 bài học trước khi gửi duyệt");
  }

  return prisma.course.update({
    where: { id },
    data: { status: nextStatus("submit"), rejectReason: null },
    include: listInclude,
  });
}

export async function remove(id: number, user: { id: number; role: UserRole }) {
  await findAndAssertCanEdit(id, user);

  // Đã có học viên đăng ký thì không xóa: mất luôn tiến độ và điểm quiz của họ.
  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrollmentCount > 0) {
    throw new AppError(
      409,
      `Khóa học đã có ${enrollmentCount} học viên đăng ký nên không thể xóa. Hãy gỡ khóa học khỏi trang công khai thay vì xóa.`
    );
  }

  await prisma.course.delete({ where: { id } });
}
