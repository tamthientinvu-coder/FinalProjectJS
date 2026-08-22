import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validate, validateQuery } from "../middleware/validate";
import { validateId } from "../middleware/validateId";
import { userQuerySchema, updateUserStatusSchema } from "../schemas/adminSchema";

const router = Router();

router.use(authenticate, authorize("admin"));

router.get("/", validateQuery(userQuerySchema), adminController.listUsers);
router.patch("/:id/status", validateId(), validate(updateUserStatusSchema), adminController.setUserStatus);

export default router;
