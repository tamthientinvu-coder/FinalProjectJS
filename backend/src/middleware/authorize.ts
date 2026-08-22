import { Request, Response, NextFunction } from "express";
import { AppError, UserRole } from "../types/api";

/** Phân quyền theo role. LUÔN đặt SAU authenticate. */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "Chưa đăng nhập"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Bạn không có quyền thực hiện thao tác này"));
    }
    next();
  };
}
