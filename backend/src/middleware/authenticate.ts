import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../types/api";

/** Bắt buộc đăng nhập: đọc Bearer token -> gắn req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Chưa đăng nhập (thiếu Authorization header)"));
  }

  try {
    const payload = verifyAccessToken(header.split(" ")[1]);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError(401, "Token đã hết hạn"));
    }
    next(new AppError(401, "Token không hợp lệ"));
  }
}

/** Không bắt buộc: có token thì gắn req.user, không có vẫn cho đi tiếp. */
export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  try {
    const payload = verifyAccessToken(header.split(" ")[1]);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    // token hỏng -> coi như khách vãng lai
  }
  next();
}
