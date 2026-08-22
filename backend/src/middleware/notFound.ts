import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/api";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`));
}
