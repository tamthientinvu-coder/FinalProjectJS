import { Request, Response, NextFunction } from "express";
import * as lessonService from "../services/lessonService";
import { logger } from "../utils/logger";

// ---- Giảng viên ----

export async function listForEditor(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.listForEditor(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.create(Number(req.params.id), req.user!, req.body);
    logger.info({ lessonId: data.id, courseId: data.courseId }, "Lesson created");
    res.status(201).json({ success: true, message: "Đã thêm bài học", data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.update(Number(req.params.id), req.user!, req.body);
    res.json({ success: true, message: "Đã cập nhật bài học", data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await lessonService.remove(Number(req.params.id), req.user!);
    res.json({ success: true, message: "Đã xóa bài học" });
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.reorder(Number(req.params.id), req.user!, req.body.items);
    res.json({ success: true, message: "Đã cập nhật thứ tự bài học", data });
  } catch (err) {
    next(err);
  }
}

// ---- Học viên ----

export async function getLearnView(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.getLearnView(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getLessonContent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.getLessonContent(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function markComplete(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await lessonService.markComplete(
      Number(req.params.id),
      req.user!,
      req.body.isCompleted
    );
    res.json({ success: true, message: "Đã cập nhật tiến độ", data });
  } catch (err) {
    next(err);
  }
}
