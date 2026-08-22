import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/api";
import { logger } from "../utils/logger";
import { env } from "../config/env";

/**
 * Error handler tập trung - PHẢI đăng ký SAU CÙNG trong app.ts.
 * Mọi lỗi trong controller chỉ cần next(err) là về đây.
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  // 1) Lỗi nghiệp vụ đã lường trước
  if (err instanceof AppError) {
    logger.warn({ status: err.statusCode, path: req.originalUrl }, err.message);
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // 2) Lỗi validate của Yup
  if (err.name === "ValidationError") {
    const errors: Record<string, string> = {};
    if (Array.isArray(err.inner) && err.inner.length > 0) {
      err.inner.forEach((e: any) => {
        if (e.path) errors[e.path] = e.message;
      });
    } else if (err.path) {
      errors[err.path] = err.message;
    }
    res.status(400).json({ success: false, message: "Dữ liệu đầu vào không hợp lệ", errors });
    return;
  }

  // 3) Lỗi Prisma thường gặp
  if (err.code === "P2002") {
    res.status(409).json({ success: false, message: "Dữ liệu đã tồn tại (trùng khóa duy nhất)" });
    return;
  }
  if (err.code === "P2025") {
    res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu yêu cầu" });
    return;
  }
  if (err.code === "P2003") {
    res.status(409).json({ success: false, message: "Dữ liệu đang được tham chiếu, không thể xóa" });
    return;
  }

  // 4) Lỗi ngoài dự kiến -> log đầy đủ, trả về thông báo chung (không lộ stack)
  logger.error({ err: err.message, stack: err.stack, path: req.originalUrl }, "Unhandled error");
  res.status(500).json({
    success: false,
    message: "Lỗi hệ thống nội bộ",
    ...(env.isProd ? {} : { debug: err.message }),
  });
}
