import { Request, Response, NextFunction } from "express";
import * as enrollmentService from "../services/enrollmentService";
import { logger } from "../utils/logger";

export async function enroll(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.enroll(Number(req.params.id), req.user!);
    logger.info({ enrollmentId: data.id, courseId: data.courseId, studentId: req.user!.id }, "Enrolled");
    res.status(201).json({ success: true, message: "Đăng ký khóa học thành công", data });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await enrollmentService.listMine(req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
