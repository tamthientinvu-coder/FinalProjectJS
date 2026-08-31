import { NextFunction, Request, Response } from "express";

import { AccessTokenPayload, AppError } from "../types/api";
import { verifyAccessToken } from "../utils/jwt";
import prisma from "../utils/prisma";

function readAccessTokenPayload(
  authorizationHeader: string | undefined,
): AccessTokenPayload {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AppError(
      401,
      "Chưa đăng nhập (thiếu Authorization header)",
    );
  }

  try {
    const token = authorizationHeader.slice("Bearer ".length);
    return verifyAccessToken(token);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw new AppError(401, "Token đã hết hạn");
    }

    throw new AppError(401, "Token không hợp lệ");
  }
}

function findUserForAuthentication(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  let payload: AccessTokenPayload;

  try {
    payload = readAccessTokenPayload(req.headers.authorization);
  } catch (error) {
    next(error);
    return;
  }

  try {
    const user = await findUserForAuthentication(payload.id);

    if (!user) {
      next(new AppError(401, "Tài khoản không còn tồn tại"));
      return;
    }

    if (!user.isActive) {
      next(
        new AppError(
          403,
          "Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên",
        ),
      );
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export async function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    next();
    return;
  }

  let payload: AccessTokenPayload;

  try {
    payload = readAccessTokenPayload(req.headers.authorization);
  } catch {
    next();
    return;
  }

  try {
    const user = await findUserForAuthentication(payload.id);

    if (user?.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}
