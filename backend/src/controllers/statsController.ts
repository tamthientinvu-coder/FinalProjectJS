import { Request, Response, NextFunction } from "express";
import * as statsService from "../services/statsService";

export async function getCourseStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await statsService.getCourseStats(Number(req.params.id), req.user!);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
