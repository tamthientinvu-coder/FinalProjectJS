import { Router } from "express";
import * as quizController from "../controllers/quizController";
import { authenticate } from "../middleware/authenticate";
import { validateId } from "../middleware/validateId";

const router = Router();

// Xem lại bài đã nộp: chủ nhân bài làm, giảng viên của khóa, hoặc admin
router.get("/:id", validateId(), authenticate, quizController.getSubmission);

export default router;
