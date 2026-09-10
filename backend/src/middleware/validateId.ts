import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/api";

// Cột id trong Postgres là INT4 (32-bit) - số vượt mốc này khiến Prisma ném
// lỗi kết nối chưa bắt (500) thay vì 400 gọn gàng. Chặn luôn ở đây.
const MAX_POSTGRES_INT4 = 2147483647;

/** Chặn /courses/abc và ID vượt phạm vi INT4 ngay từ cửa, không để Prisma nhận NaN hoặc số quá lớn. */
export function validateId(paramName = "id") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = req.params[paramName];
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0 || id > MAX_POSTGRES_INT4) {
      next(new AppError(400, `Tham số "${paramName}" phải là số nguyên dương`));
      return;
    }
    next();
  };
}
