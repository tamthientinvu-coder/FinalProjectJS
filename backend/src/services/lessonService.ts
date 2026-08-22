import prisma from "../utils/prisma";
import { AppError, UserRole } from "../types/api";
import { computeUnlock } from "./lessonRules";

interface Viewer {
  id: number;
  role: UserRole;
}

/**
 * Quyền của người đang xem đối với một khóa học.
 * Ba con đường được xem nội dung: chủ sở hữu, admin, hoặc đã đăng ký học.
 */
async function resolveAccess(courseId: number, viewer: Viewer) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, instructorId: true, status: true, thumbnail: true, level: true },
  });
  if (!course) throw new AppError(404, "Không tìm thấy khóa học");

  const isOwner = course.instructorId === viewer.id;
  const isAdmin = viewer.role === "admin";

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: viewer.id, courseId } },
    select: { id: true },
  });

  return { course, isOwner, isAdmin, enrollment, canManage: isOwner || isAdmin };
}

async function assertCanManage(courseId: number, viewer: Viewer) {
  const access = await resolveAccess(courseId, viewer);
  if (!access.canManage) {
    throw new AppError(403, "Bạn chỉ được sửa bài học của khóa học do mình tạo");
  }
  return access;
}

/** Lấy bài học kèm khóa học cha - dùng cho các thao tác trên /lessons/:id. */
async function findLessonOrFail(lessonId: number) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, title: true, instructorId: true } } },
  });
  if (!lesson) throw new AppError(404, "Không tìm thấy bài học");
  return lesson;
}

// ============ DÀNH CHO GIẢNG VIÊN ============

/** Danh sách bài học đầy đủ nội dung - chỉ chủ sở hữu và admin. */
export async function listForEditor(courseId: number, viewer: Viewer) {
  await assertCanManage(courseId, viewer);

  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: { quiz: { select: { id: true, title: true } } },
  });
}

export async function create(
  courseId: number,
  viewer: Viewer,
  input: { title: string; content?: string; videoUrl?: string | null; order?: number }
) {
  await assertCanManage(courseId, viewer);

  let order = input.order;
  if (order === undefined) {
    // Không truyền thứ tự -> xếp vào cuối
    const last = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = (last?.order ?? 0) + 1;
  } else {
    const taken = await prisma.lesson.findUnique({
      where: { courseId_order: { courseId, order } },
      select: { id: true },
    });
    if (taken) throw new AppError(409, `Đã có bài học ở vị trí số ${order}`);
  }

  return prisma.lesson.create({
    data: {
      courseId,
      title: input.title,
      content: input.content,
      videoUrl: input.videoUrl,
      order,
    },
    include: { quiz: { select: { id: true, title: true } } },
  });
}

export async function update(
  lessonId: number,
  viewer: Viewer,
  input: { title?: string; content?: string | null; videoUrl?: string | null }
) {
  const lesson = await findLessonOrFail(lessonId);
  await assertCanManage(lesson.courseId, viewer);

  return prisma.lesson.update({
    where: { id: lessonId },
    data: input,
    include: { quiz: { select: { id: true, title: true } } },
  });
}

export async function remove(lessonId: number, viewer: Viewer) {
  const lesson = await findLessonOrFail(lessonId);
  await assertCanManage(lesson.courseId, viewer);

  await prisma.lesson.delete({ where: { id: lessonId } });
}

/**
 * Đổi thứ tự bài học.
 *
 * Vì có ràng buộc @@unique([courseId, order]), đổi chỗ bài 1 và bài 2 theo
 * kiểu tuần tự sẽ vi phạm ngay ở bước đầu (hai bài cùng order = 2).
 * Cách xử lý: hai pha trong CÙNG một transaction —
 *   pha 1 đẩy toàn bộ order sang giá trị âm (vùng chắc chắn trống),
 *   pha 2 ghi lại giá trị dương mong muốn.
 * Nếu bất kỳ bước nào lỗi, transaction rollback và dữ liệu giữ nguyên.
 */
export async function reorder(
  courseId: number,
  viewer: Viewer,
  items: { id: number; order: number }[]
) {
  await assertCanManage(courseId, viewer);

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true },
  });

  const courseLessonIds = new Set(lessons.map((l) => l.id));
  const sentIds = new Set(items.map((i) => i.id));

  if (items.some((i) => !courseLessonIds.has(i.id))) {
    throw new AppError(400, "Danh sách chứa bài học không thuộc khóa học này");
  }
  if (sentIds.size !== items.length) {
    throw new AppError(400, "Danh sách có bài học bị lặp lại");
  }
  if (sentIds.size !== courseLessonIds.size) {
    throw new AppError(400, "Phải gửi đầy đủ toàn bộ bài học của khóa học khi sắp xếp lại");
  }
  if (new Set(items.map((i) => i.order)).size !== items.length) {
    throw new AppError(400, "Có hai bài học được đặt cùng một thứ tự");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.lesson.update({ where: { id: item.id }, data: { order: -item.order } });
    }
    for (const item of items) {
      await tx.lesson.update({ where: { id: item.id }, data: { order: item.order } });
    }
  });

  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    include: { quiz: { select: { id: true, title: true } } },
  });
}

// ============ DÀNH CHO HỌC VIÊN ============

/**
 * Toàn bộ dữ liệu màn hình học bài trong MỘT request:
 * thông tin khóa học, danh sách bài (chưa kèm nội dung), trạng thái hoàn thành,
 * trạng thái mở khóa và phần trăm tiến độ.
 */
export async function getLearnView(courseId: number, viewer: Viewer) {
  const access = await resolveAccess(courseId, viewer);
  if (!access.enrollment && !access.canManage) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi vào học");
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true, quiz: { select: { id: true } } },
  });

  const completedIds = new Set<number>();
  if (access.enrollment) {
    const progresses = await prisma.lessonProgress.findMany({
      where: { enrollmentId: access.enrollment.id, isCompleted: true },
      select: { lessonId: true },
    });
    progresses.forEach((p) => completedIds.add(p.lessonId));
  }

  const unlocked = computeUnlock(lessons, completedIds, access.canManage);

  return {
    course: access.course,
    isEnrolled: Boolean(access.enrollment),
    canManage: access.canManage,
    lessons: lessons.map((l) => ({
      id: l.id,
      title: l.title,
      order: l.order,
      hasQuiz: Boolean(l.quiz),
      isCompleted: completedIds.has(l.id),
      isUnlocked: unlocked.get(l.id) ?? false,
    })),
    progress: {
      completed: completedIds.size,
      total: lessons.length,
      percent: lessons.length === 0 ? 0 : Math.round((completedIds.size / lessons.length) * 100),
    },
  };
}

/**
 * Nội dung đầy đủ của một bài học.
 * Hai lớp kiểm tra ở SERVER, không phụ thuộc giao diện:
 *   1. đã đăng ký khóa học chưa,
 *   2. bài này đã được mở khóa theo thứ tự chưa.
 */
export async function getLessonContent(lessonId: number, viewer: Viewer) {
  const lesson = await findLessonOrFail(lessonId);
  const access = await resolveAccess(lesson.courseId, viewer);

  if (!access.enrollment && !access.canManage) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi xem nội dung bài học");
  }

  if (!access.canManage && access.enrollment) {
    const siblings = await prisma.lesson.findMany({
      where: { courseId: lesson.courseId },
      select: { id: true, order: true },
    });
    const progresses = await prisma.lessonProgress.findMany({
      where: { enrollmentId: access.enrollment.id, isCompleted: true },
      select: { lessonId: true },
    });
    const unlocked = computeUnlock(siblings, new Set(progresses.map((p) => p.lessonId)), false);

    if (!unlocked.get(lessonId)) {
      throw new AppError(403, "Bạn cần hoàn thành bài học trước đó mới mở được bài này");
    }
  }

  const progress = access.enrollment
    ? await prisma.lessonProgress.findUnique({
        where: { enrollmentId_lessonId: { enrollmentId: access.enrollment.id, lessonId } },
        select: { isCompleted: true, completedAt: true },
      })
    : null;

  return {
    id: lesson.id,
    courseId: lesson.courseId,
    courseTitle: lesson.course.title,
    title: lesson.title,
    content: lesson.content,
    videoUrl: lesson.videoUrl,
    order: lesson.order,
    isCompleted: progress?.isCompleted ?? false,
    completedAt: progress?.completedAt ?? null,
  };
}

/** Đánh dấu (hoặc bỏ đánh dấu) hoàn thành một bài học. */
export async function markComplete(lessonId: number, viewer: Viewer, isCompleted: boolean) {
  const lesson = await findLessonOrFail(lessonId);
  const access = await resolveAccess(lesson.courseId, viewer);

  if (!access.enrollment) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi đánh dấu hoàn thành");
  }

  // upsert: lần đầu thì tạo, các lần sau thì cập nhật.
  // Ràng buộc @@unique([enrollmentId, lessonId]) đảm bảo không sinh bản ghi trùng.
  await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: access.enrollment.id, lessonId } },
    create: {
      enrollmentId: access.enrollment.id,
      lessonId,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    update: { isCompleted, completedAt: isCompleted ? new Date() : null },
  });

  // Trả về tiến độ mới để giao diện cập nhật thanh phần trăm ngay
  return getLearnView(lesson.courseId, viewer);
}
