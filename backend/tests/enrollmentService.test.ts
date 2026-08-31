import fakePrisma, { db, resetDb } from "./helpers/fakePrisma";
import { equal, report, section } from "./helpers/assert";

const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath,
  filename: prismaPath,
  loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

const enrollmentService = require("../src/services/enrollmentService");

const STUDENT = { id: 4, role: "student" as const };

function seed(): void {
  resetDb();
  db.users.push(
    { id: 2, name: "Giảng viên", role: "instructor", isActive: true },
    { id: 4, name: "Học viên", role: "student", isActive: true }
  );
  db.courses.push(
    {
      id: 10,
      title: "JavaScript",
      instructorId: 2,
      categoryId: null,
      status: "published",
      level: "beginner",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 11,
      title: "React",
      instructorId: 2,
      categoryId: null,
      status: "published",
      level: "intermediate",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
  db.lessons.push(
    { id: 100, courseId: 10, title: "Bài 1", order: 1 },
    { id: 101, courseId: 10, title: "Bài 2", order: 2 },
    { id: 110, courseId: 11, title: "Bài 1", order: 1 }
  );
  db.quizzes.push(
    { id: 200, lessonId: 100, title: "Quiz 1", passScore: 70, maxAttempts: null },
    { id: 201, lessonId: 101, title: "Quiz 2", passScore: 70, maxAttempts: null }
  );
  db.enrollments.push(
    { id: 300, studentId: 4, courseId: 10, enrolledAt: new Date() },
    { id: 301, studentId: 4, courseId: 11, enrolledAt: new Date() }
  );
  db.lessonProgress.push({
    id: 400,
    enrollmentId: 300,
    lessonId: 100,
    isCompleted: true,
    completedAt: new Date(),
  });
  db.submissions.push(
    { id: 500, studentId: 4, quizId: 200, score: 40, attemptNo: 1 },
    { id: 501, studentId: 4, quizId: 200, score: 80, attemptNo: 2 },
    { id: 502, studentId: 4, quizId: 201, score: 60, attemptNo: 1 }
  );
}

(async () => {
  section("Tiến độ và điểm quiz trung bình của học viên");
  seed();

  const items = await enrollmentService.listMine(STUDENT);
  const javascript = items.find((item: { course: { id: number } }) => item.course.id === 10);
  const react = items.find((item: { course: { id: number } }) => item.course.id === 11);

  equal("trả đủ hai khóa đã đăng ký", items.length, 2);
  equal("tiến độ JavaScript là 1/2 bài", javascript?.progressPercent, 50);
  equal("lấy best attempt từng quiz: (80 + 60) / 2", javascript?.averageQuizScore, 70);
  equal("chưa làm quiz thì điểm trung bình là null", react?.averageQuizScore, null);

  report("enrollmentService.test.ts");
})();
