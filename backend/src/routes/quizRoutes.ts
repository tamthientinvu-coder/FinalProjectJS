import { Router } from "express";
import * as quizController from "../controllers/quizController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { updateQuizMetaSchema, submitQuizSchema } from "../schemas/quizSchema";

const router = Router();

// Sửa thông tin chung của quiz - vẫn cho phép khi đã có người nộp bài
router.patch(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(updateQuizMetaSchema),
  quizController.updateMeta
);

router.delete(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  quizController.remove
);

// Nộp bài - server tự chấm, client KHÔNG gửi điểm
router.post(
  "/:id/submit",
  validateId(),
  authenticate,
  validate(submitQuizSchema),
  quizController.submit
);

// Lịch sử các lượt làm bài của chính mình
router.get("/:id/submissions/me", validateId(), authenticate, quizController.listMySubmissions);

export default router;
