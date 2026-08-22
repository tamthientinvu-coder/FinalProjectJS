import { Router } from "express";
import * as authController from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/authenticate";
import { authLimiter } from "../middleware/rateLimiter";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/authSchema";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

export default router;
