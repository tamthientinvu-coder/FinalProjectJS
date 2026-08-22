import { Router } from "express";
import authRoutes from "./authRoutes";
import categoryRoutes from "./categoryRoutes";
import courseRoutes from "./courseRoutes";
import lessonRoutes from "./lessonRoutes";
import enrollmentRoutes from "./enrollmentRoutes";
import quizRoutes from "./quizRoutes";
import submissionRoutes from "./submissionRoutes";
import adminRoutes from "./adminRoutes";
import userRoutes from "./userRoutes";
import aiRoutes from "./aiRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/courses", courseRoutes);
router.use("/lessons", lessonRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/quiz", quizRoutes);
router.use("/submissions", submissionRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);
router.use("/ai", aiRoutes);

export default router;
