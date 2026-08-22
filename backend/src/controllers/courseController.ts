import { Request, Response, NextFunction } from "express";
import * as courseService from "../services/courseService";
import { CourseFilter } from "../services/courseService";
import { logger } from "../utils/logger";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    // validateQuery đã làm sạch và ép kiểu, nên ép kiểu ở đây là an toàn
    const filter = req.validatedQuery as unknown as CourseFilter;
    const { items, meta } = await courseService.listPublished(filter);
    res.json({ success: true, data: items, meta });
  } catch (err) {
    next(err);
  }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.listMine(req.user!.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.getById(Number(req.params.id), req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.create(req.user!.id, req.body);
    logger.info({ courseId: data.id, instructorId: req.user!.id }, "Course created");
    res.status(201).json({ success: true, message: "Tạo khóa học thành công", data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.update(Number(req.params.id), req.user!, req.body);
    res.json({ success: true, message: "Cập nhật khóa học thành công", data });
  } catch (err) {
    next(err);
  }
}

export async function submitForReview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await courseService.submitForReview(Number(req.params.id), req.user!);
    logger.info({ courseId: data.id }, "Course submitted for review");
    res.json({ success: true, message: "Đã gửi khóa học đi duyệt", data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await courseService.remove(Number(req.params.id), req.user!);
    res.json({ success: true, message: "Đã xóa khóa học" });
  } catch (err) {
    next(err);
  }
}
