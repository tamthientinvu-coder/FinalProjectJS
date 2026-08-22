import prisma from "../utils/prisma";
import { AppError, UserRole } from "../types/api";
import { computeUnlock } from "./lessonRules";
import { gradeQuiz, isPassed, type SubmittedAnswer } from "./quizGrader";

interface Viewer {
  id: number;
  role: UserRole;
}

interface QuestionInput {
  text: string;
  choices: { text: string; isCorrect: boolean }[];
}

// ============================================================
// Helper quyền truy cập
// ============================================================

/** Bài học + khóa học cha + quan hệ của người đang xem với khóa học đó. */
async function resolveLessonAccess(lessonId: number, viewer: Viewer) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: { select: { id: true, title: true, instructorId: true } },
    },
  });
  if (!lesson) throw new AppError(404, "Không tìm thấy bài học");

  const isOwner = lesson.course.instructorId === viewer.id;
  const isAdmin = viewer.role === "admin";

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: viewer.id, courseId: lesson.courseId } },
    select: { id: true },
  });

  return { lesson, enrollment, canManage: isOwner || isAdmin };
}

/** Tương tự nhưng bắt đầu từ quizId. */
async function resolveQuizAccess(quizId: number, viewer: Viewer) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, lessonId: true, title: true, passScore: true, maxAttempts: true },
  });
  if (!quiz) throw new AppError(404, "Không tìm thấy quiz");

  const access = await resolveLessonAccess(quiz.lessonId, viewer);
  return { quiz, ...access };
}

/** Học viên chỉ được động vào quiz của bài học đã mở khóa theo lộ trình. */
async function assertLessonUnlocked(courseId: number, lessonId: number, enrollmentId: number) {
  const siblings = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true, order: true },
  });
  const progresses = await prisma.lessonProgress.findMany({
    where: { enrollmentId, isCompleted: true },
    select: { lessonId: true },
  });

  const unlocked = computeUnlock(siblings, new Set(progresses.map((p) => p.lessonId)), false);
  if (!unlocked.get(lessonId)) {
    throw new AppError(403, "Bạn cần hoàn thành các bài học trước đó mới làm được quiz này");
  }
}

// ============================================================
// DÀNH CHO GIẢNG VIÊN
// ============================================================

/** Quiz kèm đáp án đúng - chỉ chủ sở hữu khóa học và admin. */
export async function getForEditor(lessonId: number, viewer: Viewer) {
  const access = await resolveLessonAccess(lessonId, viewer);
  if (!access.canManage) {
    throw new AppError(403, "Bạn chỉ được xem quiz của khóa học do mình tạo");
  }

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { choices: { orderBy: { id: "asc" } } },
      },
      _count: { select: { submissions: true } },
    },
  });

  return {
    lesson: { id: access.lesson.id, title: access.lesson.title, courseId: access.lesson.courseId },
    quiz,
    // Đã có người nộp bài thì khóa việc sửa bộ câu hỏi
    isLocked: (quiz?._count.submissions ?? 0) > 0,
  };
}

/**
 * Tạo mới hoặc thay thế toàn bộ quiz của một bài học.
 *
 * Ràng buộc quan trọng: KHÔNG cho sửa bộ câu hỏi khi đã có lượt nộp bài.
 * Lý do: Question và Choice bị xóa sẽ kéo theo (cascade) các bản ghi Answer
 * của những bài đã nộp - điểm số cũ vẫn còn nhưng không còn đối chiếu được
 * học viên đã chọn gì. Sửa đề sau khi thi là làm hỏng dữ liệu lịch sử.
 */
export async function upsert(
  lessonId: number,
  viewer: Viewer,
  input: {
    title: string;
    passScore: number;
    maxAttempts: number | null;
    questions: QuestionInput[];
  }
) {
  const access = await resolveLessonAccess(lessonId, viewer);
  if (!access.canManage) {
    throw new AppError(403, "Bạn chỉ được soạn quiz cho khóa học do mình tạo");
  }

  const existing = await prisma.quiz.findUnique({
    where: { lessonId },
    select: { id: true, _count: { select: { submissions: true } } },
  });

  if (existing && existing._count.submissions > 0) {
    throw new AppError(
      409,
      `Quiz đã có ${existing._count.submissions} lượt làm bài nên không sửa được câu hỏi. ` +
        `Bạn vẫn đổi được tên quiz, điểm đạt và số lượt làm.`
    );
  }

  const questionData = input.questions.map((q, index) => ({
    text: q.text,
    order: index + 1, // đánh số lại từ 1, không tin thứ tự client gửi lên
    choices: { create: q.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect })) },
  }));

  return prisma.$transaction(async (tx) => {
    if (!existing) {
      return tx.quiz.create({
        data: {
          lessonId,
          title: input.title,
          passScore: input.passScore,
          maxAttempts: input.maxAttempts,
          questions: { create: questionData },
        },
        include: {
          questions: { orderBy: { order: "asc" }, include: { choices: { orderBy: { id: "asc" } } } },
        },
      });
    }

    // Xóa câu hỏi cũ (Choice bị xóa theo nhờ onDelete: Cascade) rồi tạo lại,
    // tất cả trong MỘT transaction: lỗi giữa chừng thì quiz cũ vẫn nguyên vẹn.
    await tx.question.deleteMany({ where: { quizId: existing.id } });

    return tx.quiz.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        passScore: input.passScore,
        maxAttempts: input.maxAttempts,
        questions: { create: questionData },
      },
      include: {
        questions: { orderBy: { order: "asc" }, include: { choices: { orderBy: { id: "asc" } } } },
      },
    });
  });
}

/** Sửa thông tin chung - luôn cho phép, kể cả khi đã có người nộp bài. */
export async function updateMeta(
  quizId: number,
  viewer: Viewer,
  input: { title?: string; passScore?: number; maxAttempts?: number | null }
) {
  const access = await resolveQuizAccess(quizId, viewer);
  if (!access.canManage) {
    throw new AppError(403, "Bạn chỉ được sửa quiz của khóa học do mình tạo");
  }

  return prisma.quiz.update({ where: { id: quizId }, data: input });
}

export async function remove(quizId: number, viewer: Viewer) {
  const access = await resolveQuizAccess(quizId, viewer);
  if (!access.canManage) {
    throw new AppError(403, "Bạn chỉ được xóa quiz của khóa học do mình tạo");
  }

  await prisma.quiz.delete({ where: { id: quizId } });
}

// ============================================================
// DÀNH CHO HỌC VIÊN
// ============================================================

/**
 * Đề thi cho học viên.
 *
 * ĐIỂM MẤU CHỐT CỦA CẢ ĐỀ TÀI: dùng `select` để chỉ lấy id và text của đáp án.
 * Trường `isCorrect` KHÔNG bao giờ rời khỏi server ở endpoint này - nếu để lọt,
 * học viên chỉ cần mở tab Network của trình duyệt là thấy toàn bộ đáp án.
 */
export async function getForStudent(lessonId: number, viewer: Viewer) {
  const access = await resolveLessonAccess(lessonId, viewer);

  if (!access.enrollment && !access.canManage) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi làm quiz");
  }
  if (access.enrollment && !access.canManage) {
    await assertLessonUnlocked(access.lesson.courseId, lessonId, access.enrollment.id);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    select: {
      id: true,
      title: true,
      passScore: true,
      maxAttempts: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          order: true,
          // KHÔNG có isCorrect ở đây - cố ý
          choices: { orderBy: { id: "asc" }, select: { id: true, text: true } },
        },
      },
    },
  });

  if (!quiz) throw new AppError(404, "Bài học này chưa có quiz");

  const submissions = await prisma.quizSubmission.findMany({
    where: { quizId: quiz.id, studentId: viewer.id },
    orderBy: { attemptNo: "desc" },
    select: { id: true, score: true, attemptNo: true, submittedAt: true },
  });

  const used = submissions.length;
  const best = submissions.reduce<(typeof submissions)[number] | null>(
    (acc, s) => (acc === null || s.score > acc.score ? s : acc),
    null
  );

  // Giảng viên/admin CHƯA đăng ký khóa thì chỉ xem trước đề, không nộp bài được.
  // Điều kiện này phải khớp từng chữ với hàm submit() bên dưới, nếu không sẽ có
  // trường hợp giao diện khóa nút nộp nhưng API vẫn cho nộp (hoặc ngược lại).
  const isPreview = access.canManage && !access.enrollment;
  const hasAttemptLeft = quiz.maxAttempts === null || used < quiz.maxAttempts;

  return {
    lesson: { id: access.lesson.id, title: access.lesson.title, courseId: access.lesson.courseId },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      passScore: quiz.passScore,
      maxAttempts: quiz.maxAttempts,
      questionCount: quiz.questions.length,
    },
    questions: quiz.questions,
    attempts: {
      used,
      max: quiz.maxAttempts,
      canAttempt: !isPreview && hasAttemptLeft,
      best,
      last: submissions[0] ?? null,
      history: submissions,
    },
    isPreview,
  };
}

/**
 * Nộp bài và chấm điểm.
 *
 * Toàn bộ việc chấm diễn ra Ở SERVER. Client chỉ gửi lên "câu nào chọn đáp án nào",
 * không gửi điểm - nếu tin điểm do client gửi thì ai cũng tự cho mình 100.
 */
export async function submit(quizId: number, viewer: Viewer, answers: SubmittedAnswer[]) {
  const access = await resolveQuizAccess(quizId, viewer);

  if (access.canManage && !access.enrollment) {
    throw new AppError(403, "Giảng viên chỉ xem trước đề, không nộp bài được");
  }
  if (!access.enrollment) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi nộp bài");
  }

  await assertLessonUnlocked(access.lesson.courseId, access.lesson.id, access.enrollment.id);

  // Lấy đề kèm đáp án đúng - chỉ dùng nội bộ để chấm, không trả nguyên vẹn ra ngoài
  const questions = await prisma.question.findMany({
    where: { quizId },
    orderBy: { order: "asc" },
    select: { id: true, choices: { select: { id: true, isCorrect: true } } },
  });

  if (questions.length === 0) {
    throw new AppError(409, "Quiz này chưa có câu hỏi nào");
  }

  // Kiểm tra bài làm có tham chiếu tới câu hỏi lạ không (gõ tay bằng Postman chẳng hạn)
  const questionIds = new Set(questions.map((q) => q.id));
  const unknown = answers.filter((a) => !questionIds.has(a.questionId));
  if (unknown.length > 0) {
    throw new AppError(400, "Bài làm chứa câu hỏi không thuộc quiz này");
  }

  const usedAttempts = await prisma.quizSubmission.count({
    where: { quizId, studentId: viewer.id },
  });
  if (access.quiz.maxAttempts !== null && usedAttempts >= access.quiz.maxAttempts) {
    throw new AppError(
      409,
      `Bạn đã dùng hết ${access.quiz.maxAttempts} lượt làm bài cho quiz này`
    );
  }

  const result = gradeQuiz(questions, answers);
  const attemptNo = usedAttempts + 1;

  try {
    // Tạo bài nộp và toàn bộ câu trả lời trong MỘT thao tác ghi (nested create):
    // không thể xảy ra cảnh có bài nộp mà thiếu câu trả lời.
    const submission = await prisma.quizSubmission.create({
      data: {
        studentId: viewer.id,
        quizId,
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        attemptNo,
        answers: {
          create: result.answers.map((a) => ({
            questionId: a.questionId,
            choiceId: a.choiceId,
            isCorrect: a.isCorrect,
          })),
        },
      },
      select: { id: true },
    });

    return getSubmission(submission.id, viewer);
  } catch (err: unknown) {
    // @@unique([studentId, quizId, attemptNo]) chặn double-submit khi người dùng
    // bấm nộp hai lần thật nhanh: request thứ hai dính P2002 thay vì tạo bài trùng.
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
      throw new AppError(409, "Bài làm này vừa được nộp rồi, vui lòng tải lại trang");
    }
    throw err;
  }
}

/**
 * Xem lại một bài đã nộp: từng câu đúng hay sai, đáp án đúng là gì.
 * Đến bước này mới được phép lộ `isCorrect` - vì bài đã nộp xong.
 */
export async function getSubmission(submissionId: number, viewer: Viewer) {
  const submission = await prisma.quizSubmission.findUnique({
    where: { id: submissionId },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passScore: true,
          maxAttempts: true,
          lesson: { select: { id: true, title: true, courseId: true } },
        },
      },
      answers: { select: { questionId: true, choiceId: true, isCorrect: true, aiExplanation: true } },
    },
  });

  if (!submission) throw new AppError(404, "Không tìm thấy bài làm");

  // Chủ nhân bài làm, giảng viên của khóa, hoặc admin
  const course = await prisma.course.findUnique({
    where: { id: submission.quiz.lesson.courseId },
    select: { instructorId: true },
  });
  const isOwnerOfSubmission = submission.studentId === viewer.id;
  const isCourseInstructor = course?.instructorId === viewer.id;
  const isAdmin = viewer.role === "admin";

  if (!isOwnerOfSubmission && !isCourseInstructor && !isAdmin) {
    throw new AppError(403, "Bạn không có quyền xem bài làm này");
  }

  const questions = await prisma.question.findMany({
    where: { quizId: submission.quizId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      text: true,
      order: true,
      choices: { orderBy: { id: "asc" }, select: { id: true, text: true, isCorrect: true } },
    },
  });

  const answerByQuestion = new Map(submission.answers.map((a) => [a.questionId, a]));

  return {
    submission: {
      id: submission.id,
      quizId: submission.quizId,
      score: submission.score,
      correctCount: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      attemptNo: submission.attemptNo,
      submittedAt: submission.submittedAt,
      passed: isPassed(submission.score, submission.quiz.passScore),
    },
    quiz: {
      id: submission.quiz.id,
      title: submission.quiz.title,
      passScore: submission.quiz.passScore,
      maxAttempts: submission.quiz.maxAttempts,
    },
    lesson: submission.quiz.lesson,
    questions: questions.map((q) => {
      const answer = answerByQuestion.get(q.id);
      return {
        id: q.id,
        text: q.text,
        order: q.order,
        choices: q.choices,
        selectedChoiceId: answer?.choiceId ?? null,
        isCorrect: answer?.isCorrect ?? false,
        aiExplanation: answer?.aiExplanation ?? null,
      };
    }),
  };
}

/** Lịch sử các lượt làm bài của chính học viên đang đăng nhập. */
export async function listMySubmissions(quizId: number, viewer: Viewer) {
  await resolveQuizAccess(quizId, viewer); // đảm bảo quiz tồn tại

  return prisma.quizSubmission.findMany({
    where: { quizId, studentId: viewer.id },
    orderBy: { attemptNo: "desc" },
    select: {
      id: true,
      score: true,
      correctCount: true,
      totalQuestions: true,
      attemptNo: true,
      submittedAt: true,
    },
  });
}
