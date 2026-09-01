import { Router } from "express";
import * as courseController from "../controllers/courseController";
import * as lessonController from "../controllers/lessonController";
import * as enrollmentController from "../controllers/enrollmentController";
import * as adminController from "../controllers/adminController";
import * as statsController from "../controllers/statsController";
import { authenticate, authenticateOptional } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, validateQuery } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { createCourseSchema, updateCourseSchema, courseQuerySchema } from "../schemas/courseSchema";
import { createLessonSchema, reorderLessonSchema } from "../schemas/lessonSchema";
import { rejectCourseSchema, unpublishCourseSchema } from "../schemas/adminSchema";

const router = Router();

// ---------- Khóa học ----------

// 1) Danh sách khóa học đã duyệt - công khai, có lọc và phân trang
router.get("/", validateQuery(courseQuerySchema), courseController.list);

// 2) Khóa học của tôi - PHẢI khai báo TRƯỚC "/:id",
//    nếu không Express sẽ khớp "mine" vào :id và validateId báo lỗi 400.
router.get("/mine", authenticate, authorize("instructor", "admin"), courseController.listMine);

// 3) Chi tiết - khách xem được khóa đã duyệt; khóa nháp chỉ chủ sở hữu và admin
router.get("/:id", validateId(), authenticateOptional, courseController.getById);

// 4) Tạo mới - giảng viên
router.post(
  "/",
  authenticate,
  authorize("instructor", "admin"),
  validate(createCourseSchema),
  courseController.create
);

// 5) Sửa - chủ sở hữu hoặc admin (kiểm tra trong service)
router.patch(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(updateCourseSchema),
  courseController.update
);

// 6) Gửi đi duyệt - draft | rejected -> pending
router.post(
  "/:id/submit",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  courseController.submitForReview
);

// 7) Xóa - chặn nếu đã có học viên đăng ký
router.delete(
  "/:id",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  courseController.remove
);

// ---------- Bài học thuộc khóa học ----------

// Danh sách bài học đầy đủ nội dung - dành cho màn hình soạn bài của giảng viên
router.get(
  "/:id/lessons",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  lessonController.listForEditor
);

router.post(
  "/:id/lessons",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(createLessonSchema),
  lessonController.create
);

// Đổi thứ tự toàn bộ bài học trong khóa (transaction 2 pha)
router.patch(
  "/:id/lessons/reorder",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  validate(reorderLessonSchema),
  lessonController.reorder
);

// ---------- Học viên ----------

// Toàn bộ dữ liệu màn hình học bài trong 1 request
router.get("/:id/learn", validateId(), authenticate, lessonController.getLearnView);

// Đăng ký học khóa miễn phí
router.post("/:id/enroll", validateId(), authenticate, authorize("student"), enrollmentController.enroll);

// ---------- Thống kê khóa học ----------

// Chủ sở hữu hoặc admin (service kiểm tra tiếp quyền sở hữu)
router.get(
  "/:id/stats",
  validateId(),
  authenticate,
  authorize("instructor", "admin"),
  statsController.getCourseStats
);

// ---------- Quản trị viên duyệt khóa học ----------

router.patch(
  "/:id/publish",
  validateId(),
  authenticate,
  authorize("admin"),
  adminController.publishCourse
);

router.patch(
  "/:id/reject",
  validateId(),
  authenticate,
  authorize("admin"),
  validate(rejectCourseSchema),
  adminController.rejectCourse
);

router.patch(
  "/:id/unpublish",
  validateId(),
  authenticate,
  authorize("admin"),
  validate(unpublishCourseSchema),
  adminController.unpublishCourse
);

export default router;
