import { Router } from "express";
import * as enrollmentController from "../controllers/enrollmentController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";

const router = Router();

// Khóa học tôi đã đăng ký, kèm phần trăm tiến độ
router.get("/me", authenticate, authorize("student"), enrollmentController.listMine);

export default router;
