import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/api";

/** Chặn /courses/abc ngay từ cửa, không để Prisma nhận NaN. */
export function validateId(paramName = "id") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = req.params[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
      next(new AppError(400, `Tham số "${paramName}" phải là số nguyên dương`));
      return;
    }
    next();
  };
}
