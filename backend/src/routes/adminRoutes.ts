import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateQuery } from "../middleware/validate";
import { adminCourseQuerySchema } from "../schemas/adminSchema";

const router = Router();

// Toàn bộ nhánh /admin chỉ dành cho quản trị viên.
// Đặt authenticate + authorize ở cấp router thay vì lặp ở từng route:
// quên một dòng là hở nguyên một endpoint.
router.use(authenticate, authorize("admin"));

router.get("/courses", validateQuery(adminCourseQuerySchema), adminController.listCourses);
router.get("/stats", adminController.getOverviewStats);

export default router;
