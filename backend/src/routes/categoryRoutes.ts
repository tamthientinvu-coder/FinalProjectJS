import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { createCategorySchema, updateCategorySchema } from "../schemas/categorySchema";

const router = Router();

// Công khai: ai cũng cần danh mục để lọc khóa học
router.get("/", categoryController.list);

// Chỉ admin mới được thay đổi danh mục
router.post("/", authenticate, authorize("admin"), validate(createCategorySchema), categoryController.create);
router.patch(
  "/:id",
  validateId(),
  authenticate,
  authorize("admin"),
  validate(updateCategorySchema),
  categoryController.update
);
router.delete("/:id", validateId(), authenticate, authorize("admin"), categoryController.remove);

export default router;
