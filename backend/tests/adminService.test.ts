/**
 * Kiểm thử nghiệp vụ quản trị: duyệt khóa học, quản lý người dùng, thống kê.
 * Dùng Prisma giả lập nên chạy được mà không cần cơ sở dữ liệu.
 */
import fakePrisma, { db, resetDb } from "./helpers/fakePrisma";
import { ok, equal, expectError, section, report } from "./helpers/assert";

const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const adminService = require("../src/services/adminService");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const statsService = require("../src/services/statsService");

const ADMIN = { id: 1, role: "admin" as const };
const ADMIN2 = { id: 6, role: "admin" as const };
const INSTRUCTOR = { id: 2, role: "instructor" as const };
const OTHER_INSTRUCTOR = { id: 3, role: "instructor" as const };
const STUDENT = { id: 4, role: "student" as const };

function seed() {
  resetDb();
  db.users.push(
    { id: 1, name: "Quản trị A", email: "admin@x.vn", password: "hash", refreshToken: "rt1", role: "admin", isActive: true, createdAt: new Date("2026-01-01") },
    { id: 2, name: "Giảng viên Minh", email: "gv@x.vn", password: "hash", refreshToken: "rt2", role: "instructor", isActive: true, createdAt: new Date("2026-01-02") },
    { id: 3, name: "Giảng viên Hà", email: "gv2@x.vn", password: "hash", refreshToken: null, role: "instructor", isActive: true, createdAt: new Date("2026-01-03") },
    { id: 4, name: "Học viên Nam", email: "hv@x.vn", password: "hash", refreshToken: "rt4", role: "student", isActive: true, createdAt: new Date("2026-01-04") },
    { id: 5, name: "Học viên Mai", email: "hv2@x.vn", password: "hash", refreshToken: "rt5", role: "student", isActive: true, createdAt: new Date("2026-01-05") },
    { id: 6, name: "Quản trị B", email: "admin2@x.vn", password: "hash", refreshToken: "rt6", role: "admin", isActive: true, createdAt: new Date("2026-01-06") }
  );
  db.categories.push({ id: 50, name: "Lập trình Web", slug: "lap-trinh-web" });
  db.courses.push(
    { id: 10, title: "JavaScript căn bản", instructorId: 2, categoryId: 50, status: "published", level: "beginner", rejectReason: null, publishedAt: new Date("2026-02-01"), createdAt: new Date("2026-01-10"), updatedAt: new Date("2026-02-01") },
    { id: 11, title: "ReactJS thực chiến", instructorId: 2, categoryId: 50, status: "pending", level: "intermediate", rejectReason: null, publishedAt: null, createdAt: new Date("2026-01-11"), updatedAt: new Date("2026-01-20") },
    { id: 12, title: "PostgreSQL và Prisma", instructorId: 3, categoryId: 50, status: "pending", level: "intermediate", rejectReason: null, publishedAt: null, createdAt: new Date("2026-01-12"), updatedAt: new Date("2026-01-15") },
    { id: 13, title: "Docker nhập môn", instructorId: 3, categoryId: null, status: "draft", level: "beginner", rejectReason: null, publishedAt: null, createdAt: new Date("2026-01-13"), updatedAt: new Date("2026-01-13") }
  );
  db.lessons.push(
    { id: 100, courseId: 10, title: "Biến và kiểu dữ liệu", order: 1 },
    { id: 101, courseId: 10, title: "Hàm và closure", order: 2 }
  );
  db.quizzes.push(
    { id: 200, lessonId: 100, title: "KT bài 1", passScore: 70, maxAttempts: null },
    { id: 201, lessonId: 101, title: "KT bài 2", passScore: 50, maxAttempts: null }
  );
  db.enrollments.push(
    { id: 300, studentId: 4, courseId: 10, enrolledAt: new Date("2026-03-01") },
    { id: 301, studentId: 5, courseId: 10, enrolledAt: new Date("2026-03-02") }
  );
  // Nam xong 1/2 bài; Mai xong 2/2 bài
  db.lessonProgress.push(
    { id: 400, enrollmentId: 300, lessonId: 100, isCompleted: true, completedAt: new Date() },
    { id: 401, enrollmentId: 301, lessonId: 100, isCompleted: true, completedAt: new Date() },
    { id: 402, enrollmentId: 301, lessonId: 101, isCompleted: true, completedAt: new Date() }
  );
  // Quiz 200: Nam 80 và 60, Mai 100  |  Quiz 201: Mai 40
  db.submissions.push(
    { id: 500, studentId: 4, quizId: 200, score: 80, correctCount: 4, totalQuestions: 5, attemptNo: 1, submittedAt: new Date() },
    { id: 501, studentId: 4, quizId: 200, score: 60, correctCount: 3, totalQuestions: 5, attemptNo: 2, submittedAt: new Date() },
    { id: 502, studentId: 5, quizId: 200, score: 100, correctCount: 5, totalQuestions: 5, attemptNo: 1, submittedAt: new Date() },
    { id: 503, studentId: 5, quizId: 201, score: 40, correctCount: 2, totalQuestions: 5, attemptNo: 1, submittedAt: new Date() }
  );
}

(async () => {
  // ============================================================
  section("A. DUYỆT KHÓA HỌC - máy trạng thái");
  seed();

  const published = await adminService.publishCourse(11);
  equal("duyệt khóa chờ duyệt -> published", published.status, "published");
  ok("ghi mốc thời gian công khai", published.publishedAt instanceof Date);
  equal("xóa lý do từ chối cũ", published.rejectReason, null);

  await expectError("duyệt khóa đã công khai", () => adminService.publishCourse(10), 409, "Đang hiển thị công khai");
  await expectError("duyệt khóa bản nháp", () => adminService.publishCourse(13), 409, "Bản nháp");
  await expectError("duyệt khóa không tồn tại", () => adminService.publishCourse(9999), 404);

  const rejected = await adminService.rejectCourse(12, "Nội dung bài học còn sơ sài, cần bổ sung ví dụ");
  equal("từ chối khóa chờ duyệt -> rejected", rejected.status, "rejected");
  equal("lưu lý do từ chối", rejected.rejectReason, "Nội dung bài học còn sơ sài, cần bổ sung ví dụ");
  await expectError("từ chối khóa đã bị từ chối", () => adminService.rejectCourse(12, "lý do khác đủ dài"), 409);

  const unpublished = await adminService.unpublishCourse(10, "Phát hiện nội dung vi phạm bản quyền");
  equal("gỡ khóa đã công khai -> draft", unpublished.status, "draft");
  equal("xóa mốc công khai", unpublished.publishedAt, null);
  await expectError("gỡ khóa chưa công khai", () => adminService.unpublishCourse(13, "lý do đủ dài để hợp lệ"), 409);

  // ============================================================
  section("B. HÀNG ĐỢI DUYỆT");
  seed();

  const pendingList = await adminService.listCourses({ status: "pending", page: 1, limit: 10 });
  equal("lọc đúng 2 khóa chờ duyệt", pendingList.items.length, 2);
  ok("khóa chờ lâu nhất lên đầu", pendingList.items[0].id === 12);
  ok("kèm thông tin giảng viên", pendingList.items[0].instructor.name === "Giảng viên Hà");

  const allList = await adminService.listCourses({ page: 1, limit: 10 });
  equal("không lọc -> trả về tất cả", allList.meta.total, 4);

  const searched = await adminService.listCourses({ search: "react", page: 1, limit: 10 });
  equal("tìm theo tên khóa học (không phân biệt hoa thường)", searched.items.length, 1);

  const byInstructor = await adminService.listCourses({ search: "Hà", page: 1, limit: 10 });
  equal("tìm theo tên giảng viên", byInstructor.items.length, 2);

  const paged = await adminService.listCourses({ page: 2, limit: 3 });
  equal("phân trang: trang 2 còn 1 khóa", paged.items.length, 1);
  equal("tổng số trang", paged.meta.totalPages, 2);

  const counts = await adminService.countCoursesByStatus();
  equal("đếm theo trạng thái", counts, { draft: 1, pending: 2, published: 1, rejected: 0 });

  // ============================================================
  section("C. QUẢN LÝ NGƯỜI DÙNG");
  seed();

  const users = await adminService.listUsers({ page: 1, limit: 10 });
  equal("tổng số người dùng", users.meta.total, 6);
  const raw = JSON.stringify(users.items);
  ok("KHÔNG lộ mật khẩu", !raw.includes("password") && !raw.includes("hash"));
  ok("KHÔNG lộ refreshToken", !raw.includes("refreshToken") && !raw.includes("rt1"));
  ok("kèm số liệu đóng góp của từng người", users.items[0]._count !== undefined);

  equal("lọc theo vai trò", (await adminService.listUsers({ role: "instructor", page: 1, limit: 10 })).meta.total, 2);
  equal("tìm theo email", (await adminService.listUsers({ search: "hv2@", page: 1, limit: 10 })).meta.total, 1);
  equal("tìm theo tên", (await adminService.listUsers({ search: "mai", page: 1, limit: 10 })).meta.total, 1);
  equal("lọc theo trạng thái hoạt động", (await adminService.listUsers({ isActive: true, page: 1, limit: 10 })).meta.total, 6);

  // ============================================================
  section("D. KHÓA / MỞ TÀI KHOẢN - các lớp bảo vệ");
  seed();

  const locked = await adminService.setUserStatus(4, false, ADMIN);
  equal("khóa học viên", locked.isActive, false);
  equal("THU HỒI refreshToken khi khóa", db.users.find((u) => u.id === 4)!.refreshToken, null);

  const unlocked = await adminService.setUserStatus(4, true, ADMIN);
  equal("mở lại tài khoản", unlocked.isActive, true);

  await expectError("tự khóa chính mình", () => adminService.setUserStatus(1, false, ADMIN), 409, "chính mình");
  await expectError("khóa lại tài khoản đang bị khóa", async () => {
    await adminService.setUserStatus(5, false, ADMIN);
    return adminService.setUserStatus(5, false, ADMIN);
  }, 409, "đã ở trạng thái");
  await expectError("khóa người không tồn tại", () => adminService.setUserStatus(9999, false, ADMIN), 404);

  // Kịch bản thật: quản trị B khóa quản trị A, rồi A (token còn hiệu lực 15 phút)
  // quay lại khóa nốt B -> hệ thống sẽ không còn ai quản trị được.
  seed();
  await adminService.setUserStatus(1, false, ADMIN2);
  equal("quản trị B khóa được quản trị A", db.users.find((u) => u.id === 1)!.isActive, false);
  await expectError(
    "chặn khóa quản trị viên hoạt động CUỐI CÙNG",
    () => adminService.setUserStatus(6, false, ADMIN),
    409,
    "cuối cùng"
  );

  // ============================================================
  section("E. THỐNG KÊ TỔNG QUAN");
  seed();

  const overview = await adminService.getOverviewStats();
  equal("đếm người dùng theo vai trò", overview.users, { student: 2, instructor: 2, admin: 2, total: 6 });
  equal("đếm khóa học theo trạng thái", overview.courses, { draft: 1, pending: 2, published: 1, rejected: 0, total: 4 });
  equal("tổng lượt đăng ký", overview.enrollments, 2);
  equal("tổng lượt nộp bài", overview.submissions, 4);
  equal("điểm trung bình toàn hệ thống (80+60+100+40)/4", overview.avgScore, 70);
  equal("chỉ xếp hạng khóa đã công khai", overview.topCourses.length, 1);
  equal("khóa nhiều học viên nhất", overview.topCourses[0].title, "JavaScript căn bản");
  equal("kèm số học viên", overview.topCourses[0]._count.enrollments, 2);

  resetDb();
  const emptyOverview = await adminService.getOverviewStats();
  equal("hệ thống rỗng: điểm trung bình là null chứ không phải 0", emptyOverview.avgScore, null);
  equal("hệ thống rỗng: tổng bằng 0", emptyOverview.users.total, 0);

  // ============================================================
  section("F. THỐNG KÊ KHÓA HỌC CHO GIẢNG VIÊN");
  seed();

  await expectError("giảng viên khác xem trộm", () => statsService.getCourseStats(10, OTHER_INSTRUCTOR), 403, "do mình tạo");
  await expectError("học viên xem thống kê", () => statsService.getCourseStats(10, STUDENT), 403);
  await expectError("khóa học không tồn tại", () => statsService.getCourseStats(9999, ADMIN), 404);

  const stats = await statsService.getCourseStats(10, INSTRUCTOR);
  equal("số học viên", stats.totals.students, 2);
  equal("số bài học", stats.totals.lessons, 2);
  equal("số quiz", stats.totals.quizzes, 2);
  equal("tổng lượt nộp bài", stats.totals.submissions, 4);
  equal("tiến độ trung bình (50% + 100%)/2", stats.progress.avgPercent, 75);
  equal("số học viên hoàn thành 100%", stats.progress.completedAll, 1);
  equal("điểm trung bình lớp (80+60+100+40)/4", stats.classAvgScore, 70);

  const quizA = stats.quizzes.find((q: any) => q.quizId === 200);
  equal("quiz 1: số lượt làm", quizA.attempts, 3);
  equal("quiz 1: số học viên khác nhau", quizA.uniqueStudents, 2);
  equal("quiz 1: điểm trung bình (80+60+100)/3", quizA.avgScore, 80);
  equal("quiz 1: điểm cao nhất", quizA.maxScore, 100);
  equal("quiz 1: số lượt đạt (>=70)", quizA.passCount, 2);
  equal("quiz 1: tỷ lệ đạt 2/3", quizA.passRate, 67);

  const quizB = stats.quizzes.find((q: any) => q.quizId === 201);
  equal("quiz 2: ngưỡng đạt riêng là 50", quizB.passScore, 50);
  equal("quiz 2: 40 điểm -> không đạt", quizB.passCount, 0);
  equal("quiz 2: tỷ lệ đạt 0%", quizB.passRate, 0);

  const nam = stats.students.find((s: any) => s.id === 4);
  equal("học viên Nam: tiến độ 1/2 bài", nam.progressPercent, 50);
  equal("học viên Nam: 2 lượt nộp", nam.submissions, 2);
  equal("học viên Nam: điểm trung bình (80+60)/2", nam.avgScore, 70);
  equal("học viên Nam: điểm cao nhất", nam.bestScore, 80);
  ok("KHÔNG lộ mật khẩu học viên", !JSON.stringify(stats.students).includes("password"));

  equal("admin xem được thống kê mọi khóa", (await statsService.getCourseStats(10, ADMIN)).totals.students, 2);

  // Khóa học chưa ai đăng ký
  const emptyStats = await statsService.getCourseStats(13, OTHER_INSTRUCTOR);
  equal("khóa rỗng: 0 học viên", emptyStats.totals.students, 0);
  equal("khóa rỗng: tiến độ 0% chứ không NaN", emptyStats.progress.avgPercent, 0);
  equal("khóa rỗng: điểm trung bình null", emptyStats.classAvgScore, null);

  section("G. KHÔNG LÀM TRÒN TRUNG GIAN KHI TÍNH ĐIỂM LỚP");
  seed();
  // Quiz A: (0 + 0 + 1)/3; quiz B: 1. Trung bình thật = 0.5 -> 1.
  db.submissions.forEach((s, i) => { s.score = [0, 0, 1, 1][i]; });
  equal("điểm lớp chỉ làm tròn một lần", (await statsService.getCourseStats(10, INSTRUCTOR)).classAvgScore, 1);

  report("adminService.test.ts");
})().catch((e) => {
  console.error("LỖI NGOÀI DỰ KIẾN:", e);
  process.exit(1);
});
