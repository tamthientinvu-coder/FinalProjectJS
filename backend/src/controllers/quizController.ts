import { Request, Response, NextFunction } from "express";
import * as quizService from "../services/quizService";
import { logger } from "../utils/logger";

// ---- Giảng viên ----

export async function getForEditor(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getForEditor(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function upsert(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.upsert(Number(req.params.id), req.user!, req.body);
    logger.info({ quizId: data.id, lessonId: data.lessonId }, "Quiz saved");
    res.json({ success: true, message: "Đã lưu quiz", data });
  } catch (err) {
    next(err);
  }
}

export async function updateMeta(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.updateMeta(Number(req.params.id), req.user!, req.body);
    res.json({ success: true, message: "Đã cập nhật thông tin quiz", data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await quizService.remove(Number(req.params.id), req.user!);
    res.json({ success: true, message: "Đã xóa quiz" });
  } catch (err) {
    next(err);
  }
}

// ---- Học viên ----

export async function getForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getForStudent(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.submit(Number(req.params.id), req.user!, req.body.answers);
    logger.info(
      { submissionId: data.submission.id, quizId: data.submission.quizId, score: data.submission.score },
      "Quiz submitted"
    );
    res.status(201).json({ success: true, message: "Đã nộp bài", data });
  } catch (err) {
    next(err);
  }
}

export async function listMySubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.listMySubmissions(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await quizService.getSubmission(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
