import prisma from "../utils/prisma";
import { AppError, UserRole } from "../types/api";
import { generateJson, generateText, isConfigured } from "./geminiClient";
import { aiQuestionsSchema } from "../schemas/quizSchema";
import { logger } from "../utils/logger";

interface Viewer {
  id: number;
  role: UserRole;
}

/** Cắt bớt nội dung dài trước khi đưa vào prompt để khỏi vượt hạn mức token. */
function trim(text: string | null | undefined, max = 6000): string {
  const value = (text ?? "").trim();
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

async function resolveLesson(lessonId: number, viewer: Viewer) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: { select: { id: true, title: true, instructorId: true } } },
  });
  if (!lesson) throw new AppError(404, "Không tìm thấy bài học");

  const canManage = lesson.course.instructorId === viewer.id || viewer.role === "admin";
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: viewer.id, courseId: lesson.courseId } },
    select: { id: true },
  });

  return { lesson, canManage, enrollment };
}

export function aiStatus() {
  return { configured: isConfigured() };
}

// ============================================================
// 1. SINH CÂU HỎI QUIZ TỪ NỘI DUNG BÀI HỌC
// ============================================================

/** Cấu trúc JSON yêu cầu Gemini trả về. */
const QUIZ_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          choices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                isCorrect: { type: "boolean" },
              },
              required: ["text", "isCorrect"],
            },
          },
        },
        required: ["text", "choices"],
      },
    },
  },
  required: ["questions"],
};

/**
 * Sinh nháp câu hỏi trắc nghiệm từ nội dung bài học.
 *
 * KHÔNG tự lưu vào cơ sở dữ liệu. Kết quả trả về giao diện để giảng viên
 * đọc, sửa rồi mới bấm lưu qua endpoint soạn quiz thông thường - AI là
 * công cụ hỗ trợ soạn thảo, không phải người ra đề.
 */
export async function generateQuizQuestions(
  lessonId: number,
  viewer: Viewer,
  input: { count: number; content?: string }
) {
  const { lesson, canManage } = await resolveLesson(lessonId, viewer);
  if (!canManage) {
    throw new AppError(403, "Chỉ giảng viên của khóa học mới dùng được tính năng này");
  }

  // Ưu tiên nội dung giảng viên vừa dán vào form, chưa kịp lưu
  const source = trim(input.content?.trim() || lesson.content);
  if (source.length < 100) {
    throw new AppError(
      400,
      "Nội dung bài học quá ngắn (cần ít nhất 100 ký tự) để AI sinh được câu hỏi có ý nghĩa"
    );
  }

  const prompt = `Bạn là giáo viên ra đề trắc nghiệm. Dựa DUY NHẤT vào nội dung bài học dưới đây, hãy soạn ${input.count} câu hỏi trắc nghiệm bằng tiếng Việt.

QUY TẮC BẮT BUỘC:
- Mỗi câu hỏi có ĐÚNG 4 đáp án.
- Mỗi câu hỏi có ĐÚNG 1 đáp án đúng (isCorrect = true), 3 đáp án còn lại sai.
- Ba đáp án sai phải hợp lý, gần đúng, không được ngớ ngẩn hay lạc đề.
- Câu hỏi phải trả lời được bằng chính nội dung bài học, không hỏi kiến thức ngoài bài.
- Không đánh số thứ tự vào đầu câu hỏi.
- Không nhắc tới "theo bài học trên" hay "theo đoạn văn".

TÊN BÀI HỌC: ${lesson.title}

NỘI DUNG BÀI HỌC:
"""
${source}
"""`;

  const raw = await generateJson<{ questions: unknown[] }>(prompt, QUIZ_RESPONSE_SCHEMA, {
    temperature: 0.6,
    maxOutputTokens: 4096,
  });

  // ĐIỂM QUAN TRỌNG: đầu ra của AI đi qua ĐÚNG bộ validate dùng cho dữ liệu
  // người dùng nhập tay. AI cũng chỉ là một nguồn đầu vào không đáng tin.
  let validated;
  try {
    validated = await aiQuestionsSchema.validate(raw.questions, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err: unknown) {
    const errors = (err as { errors?: string[] }).errors ?? [];
    logger.warn({ errors }, "Gemini output failed quiz validation");
    throw new AppError(
      422,
      `AI trả về câu hỏi không đạt chuẩn (${errors[0] ?? "sai định dạng"}). Hãy bấm sinh lại.`
    );
  }

  logger.info({ lessonId, count: validated.length, instructorId: viewer.id }, "AI generated quiz draft");

  return {
    lesson: { id: lesson.id, title: lesson.title, courseId: lesson.courseId },
    questions: validated,
    notice: "Nội dung do AI đề xuất — giảng viên cần đọc lại và chỉnh sửa trước khi lưu.",
  };
}

// ============================================================
// 2. GIẢI THÍCH ĐÁP ÁN SAI
// ============================================================

/**
 * Giải thích vì sao một câu trả lời là sai.
 *
 * Kết quả được LƯU vào Answer.aiExplanation: lần sau xem lại bài không phải
 * gọi Gemini nữa - vừa nhanh cho người dùng, vừa không tốn hạn mức API.
 */
export async function explainWrongAnswer(
  submissionId: number,
  questionId: number,
  viewer: Viewer
) {
  const answer = await prisma.answer.findUnique({
    where: { submissionId_questionId: { submissionId, questionId } },
    include: {
      submission: { select: { id: true, studentId: true, quizId: true } },
      question: {
        select: {
          id: true,
          text: true,
          quiz: { select: { lesson: { select: { id: true, title: true, content: true, courseId: true } } } },
          choices: { select: { id: true, text: true, isCorrect: true } },
        },
      },
    },
  });

  if (!answer) throw new AppError(404, "Không tìm thấy câu trả lời này");

  // Chỉ chính chủ bài làm (hoặc admin) mới xem được lời giải thích
  const isOwner = answer.submission.studentId === viewer.id;
  if (!isOwner && viewer.role !== "admin") {
    throw new AppError(403, "Bạn không có quyền xem bài làm này");
  }

  if (answer.isCorrect) {
    throw new AppError(400, "Câu này bạn đã trả lời đúng, không cần giải thích");
  }

  // Đã có giải thích trong CSDL -> trả luôn, không gọi AI lần nữa
  if (answer.aiExplanation) {
    return { questionId, explanation: answer.aiExplanation, cached: true };
  }

  const lesson = answer.question.quiz.lesson;
  const correct = answer.question.choices.find((c) => c.isCorrect);
  const chosen = answer.question.choices.find((c) => c.id === answer.choiceId);

  const prompt = `Bạn là trợ giảng thân thiện. Học viên vừa làm sai một câu trắc nghiệm. Hãy giải thích ngắn gọn bằng tiếng Việt.

YÊU CẦU:
- Tối đa 4 câu văn.
- Nói rõ vì sao đáp án học viên chọn là sai, rồi vì sao đáp án đúng là đúng.
- Chỉ dựa vào nội dung bài học bên dưới, không bịa thêm kiến thức ngoài bài.
- Giọng khích lệ, không chê bai.
- Trả về văn bản thuần, không dùng markdown, không xuống dòng thừa.

BÀI HỌC: ${lesson.title}
NỘI DUNG BÀI HỌC:
"""
${trim(lesson.content, 4000)}
"""

CÂU HỎI: ${answer.question.text}
HỌC VIÊN ĐÃ CHỌN: ${chosen ? chosen.text : "(bỏ trống, không chọn đáp án nào)"}
ĐÁP ÁN ĐÚNG: ${correct?.text ?? "(không xác định)"}`;

  const explanation = await generateText(prompt, { temperature: 0.3, maxOutputTokens: 512 });

  await prisma.answer.update({
    where: { submissionId_questionId: { submissionId, questionId } },
    data: { aiExplanation: explanation },
  });

  logger.info({ submissionId, questionId, studentId: viewer.id }, "AI explained wrong answer");

  return { questionId, explanation, cached: false };
}

// ============================================================
// 3. TÓM TẮT BÀI HỌC
// ============================================================

/** Tóm tắt bài học dài thành gạch đầu dòng để ôn nhanh trước khi làm quiz. */
export async function summarizeLesson(lessonId: number, viewer: Viewer) {
  const { lesson, canManage, enrollment } = await resolveLesson(lessonId, viewer);

  if (!enrollment && !canManage) {
    throw new AppError(403, "Bạn cần đăng ký khóa học này trước khi dùng tính năng tóm tắt");
  }

  const source = trim(lesson.content);
  if (source.length < 100) {
    throw new AppError(400, "Bài học quá ngắn, không cần tóm tắt");
  }

  const prompt = `Tóm tắt bài học dưới đây thành 3 đến 5 gạch đầu dòng bằng tiếng Việt, giúp học viên ôn nhanh trước khi làm bài kiểm tra.

YÊU CẦU:
- Mỗi ý một dòng, bắt đầu bằng dấu gạch ngang "- ".
- Mỗi ý tối đa 25 từ, nêu đúng khái niệm cốt lõi.
- Không thêm lời dẫn, không thêm tiêu đề, chỉ trả về các gạch đầu dòng.

BÀI HỌC: ${lesson.title}
NỘI DUNG:
"""
${source}
"""`;

  const summary = await generateText(prompt, { temperature: 0.3, maxOutputTokens: 512 });

  // Chuẩn hóa về mảng để giao diện tự quyết định cách hiển thị
  const bullets = summary
    .split("\n")
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);

  return {
    lesson: { id: lesson.id, title: lesson.title },
    bullets,
    notice: "Bản tóm tắt do AI tạo — vẫn nên đọc kỹ bài học đầy đủ.",
  };
}
