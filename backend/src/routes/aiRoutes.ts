import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { aiLimiter } from "../middleware/rateLimiter";
import { generateQuizSchema, explainAnswerSchema } from "../schemas/aiSchema";

const router = Router();

// Mọi endpoint AI đều cần đăng nhập và đều bị giới hạn tần suất:
// Gemini tính tiền theo request nên phải chặn lạm dụng ngay ở cửa.
router.use(authenticate, aiLimiter);

// Giao diện hỏi trước để ẩn/hiện các nút AI cho gọn
router.get("/status", aiController.status);

// 1) Giảng viên: sinh nháp câu hỏi từ nội dung bài học
router.post(
  "/lessons/:id/generate-quiz",
  validateId(),
  authorize("instructor", "admin"),
  validate(generateQuizSchema),
  aiController.generateQuiz
);

// 2) Học viên: vì sao đáp án mình chọn là sai
router.post("/explain-answer", validate(explainAnswerSchema), aiController.explainAnswer);

// 3) Học viên: tóm tắt bài học để ôn nhanh
router.post("/lessons/:id/summarize", validateId(), aiController.summarizeLesson);

export default router;
