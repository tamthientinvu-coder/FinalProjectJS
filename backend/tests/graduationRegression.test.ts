import fakePrisma, { db, resetDb } from "./helpers/fakePrisma";
import { equal, expectError, ok, report, section } from "./helpers/assert";

const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

const courseService = require("../src/services/courseService");
const lessonService = require("../src/services/lessonService");
const enrollmentService = require("../src/services/enrollmentService");

const STUDENT = { id: 4, role: "student" as const };
const INSTRUCTOR = { id: 2, role: "instructor" as const };
const ADMIN = { id: 1, role: "admin" as const };

function seed(status = "published") {
  resetDb();
  db.users.push(
    { id: 1, name: "Admin", role: "admin", isActive: true },
    { id: 2, name: "Giảng viên", role: "instructor", isActive: true },
    { id: 4, name: "Học viên", role: "student", isActive: true }
  );
  db.categories.push({ id: 9, name: "Web", slug: "web" });
  db.courses.push({
    id: 10, title: "JavaScript", description: "Mô tả đầy đủ", thumbnail: "https://img.test/course.jpg",
    categoryId: 9, instructorId: 2, status, level: "beginner", rejectReason: null,
  });
  db.lessons.push(
    { id: 100, courseId: 10, title: "Bài 1", content: "Nội dung", order: 1 },
    { id: 101, courseId: 10, title: "Bài 2", content: "Nội dung", order: 2 }
  );
  db.enrollments.push({ id: 300, studentId: 4, courseId: 10 });
}

(async () => {
  section("A. TOÀN VẸN LỘ TRÌNH HỌC");
  seed();
  await expectError("không thể hoàn thành bài đang bị khóa",
    () => lessonService.markComplete(101, STUDENT, true), 403, "bài học trước");
  ok("không tạo tiến độ giả", db.lessonProgress.length === 0);

  db.lessonProgress.push({ id: 400, enrollmentId: 300, lessonId: 100, isCompleted: true });
  await lessonService.markComplete(101, STUDENT, true);
  ok("hoàn thành bài sau khi mở khóa", db.lessonProgress.some((p) => p.lessonId === 101 && p.isCompleted));

  section("B. BẢO TOÀN LỊCH SỬ HỌC TẬP");
  seed("draft");
  db.lessonProgress.push({ id: 400, enrollmentId: 300, lessonId: 100, isCompleted: true });
  await expectError("không xóa bài học đã có tiến độ",
    () => lessonService.remove(100, INSTRUCTOR), 409, "tiến độ");
  ok("bài học lịch sử vẫn còn", db.lessons.some((l) => l.id === 100));

  section("C. VÒNG DUYỆT KHI CHỈNH SỬA");
  seed("pending");
  await expectError("giảng viên không sửa khóa đang chờ duyệt",
    () => courseService.update(10, INSTRUCTOR, { title: "Lách duyệt" }), 409, "chờ duyệt");
  await expectError("giảng viên không sửa bài của khóa đang chờ duyệt",
    () => lessonService.update(100, INSTRUCTOR, { title: "Lách duyệt" }), 409, "chờ duyệt");

  seed("published");
  await courseService.update(10, INSTRUCTOR, { title: "Bản sửa cần duyệt lại" });
  equal("sửa khóa công khai -> tự về draft", db.courses[0].status, "draft");
  equal("xóa mốc công khai khi sửa", db.courses[0].publishedAt, null);

  seed("published");
  await lessonService.update(100, INSTRUCTOR, { title: "Bài đã sửa" });
  equal("sửa nội dung con -> khóa cũng về draft", db.courses[0].status, "draft");

  seed("published");
  await lessonService.update(100, ADMIN, { title: "Admin hiệu chỉnh" });
  equal("admin hiệu chỉnh không tự đổi trạng thái", db.courses[0].status, "published");

  section("D. ĐỦ THÔNG TIN TRƯỚC KHI GỬI DUYỆT");
  seed("draft");
  db.courses[0].description = "  ";
  await expectError("thiếu mô tả -> không gửi duyệt",
    () => courseService.submitForReview(10, INSTRUCTOR), 400, "mô tả");
  db.courses[0].description = "Đã đủ";
  db.courses[0].thumbnail = null;
  await expectError("thiếu ảnh đại diện -> không gửi duyệt",
    () => courseService.submitForReview(10, INSTRUCTOR), 400, "ảnh đại diện");
  db.courses[0].thumbnail = "https://img.test/course.jpg";
  db.courses[0].categoryId = null;
  await expectError("thiếu danh mục -> không gửi duyệt",
    () => courseService.submitForReview(10, INSTRUCTOR), 400, "danh mục");

  section("E. PHÒNG THỦ VAI TRÒ Ở TẦNG SERVICE");
  seed();
  await expectError("giảng viên không thể đăng ký như học viên",
    () => enrollmentService.enroll(10, INSTRUCTOR), 403, "học viên");
  await expectError("admin không thể lấy danh sách khóa đang học",
    () => enrollmentService.listMine(ADMIN), 403, "học viên");

  report("graduationRegression.test.ts");
})().catch((e) => { console.error("LỖI NGOÀI DỰ KIẾN:", e); process.exit(1); });
