import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { logger } from "../utils/logger";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.register(req.body);
    logger.info({ userId: user.id, role: user.role }, "User registered");
    res.status(201).json({ success: true, message: "Đăng ký thành công", data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    logger.info({ userId: result.user.id }, "User logged in");
    res.json({ success: true, message: "Đăng nhập thành công", data: result });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, message: "Làm mới token thành công", data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.id);
    res.json({ success: true, message: "Đăng xuất thành công" });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
