import { Request, Response, NextFunction } from "express";
import * as aiService from "../services/aiService";

export async function status(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: aiService.aiStatus() });
  } catch (err) {
    next(err);
  }
}

export async function generateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await aiService.generateQuizQuestions(Number(req.params.id), req.user!, req.body);
    res.json({ success: true, message: "AI đã soạn xong bản nháp câu hỏi", data });
  } catch (err) {
    next(err);
  }
}

export async function explainAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const { submissionId, questionId } = req.body;
    const data = await aiService.explainWrongAnswer(submissionId, questionId, req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function summarizeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await aiService.summarizeLesson(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
