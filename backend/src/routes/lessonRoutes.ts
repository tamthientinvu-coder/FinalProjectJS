import { Router } from "express";
import * as lessonController from "../controllers/lessonController";
import * as quizController from "../controllers/quizController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { updateLessonSchema, completeLessonSchema } from "../schemas/lessonSchema";
import { upsertQuizSchema } from "../schemas/quizSchema";

const router = Router();

// Xem nội dung bài học - phải đăng nhập, service kiểm tra tiếp đã enroll và đã mở khóa chưa
router.get("/:id", validateId(), authenticate, lessonController.getLessonContent);

// Sửa / xóa - chủ sở hữu khóa học hoặc admin
router.patch(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(updateLessonSchema),
  lessonController.update
);
router.delete(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  lessonController.remove
);

// Đánh dấu hoàn thành - học viên đã đăng ký
router.patch(
  "/:id/complete",
  validateId(),
  authenticate,
  authorize("student"),
  validate(completeLessonSchema),
  lessonController.markComplete
);

// ---------- Quiz của bài học ----------

// Đề cho học viên - TUYỆT ĐỐI không kèm isCorrect
router.get("/:id/quiz", validateId(), authenticate, quizController.getForStudent);

// Đề kèm đáp án đúng - chỉ giảng viên sở hữu khóa học và admin
router.get(
  "/:id/quiz/editor",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  quizController.getForEditor
);

// Tạo mới hoặc thay thế trọn gói bộ câu hỏi
router.put(
  "/:id/quiz",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(upsertQuizSchema),
  quizController.upsert
);

export default router;
