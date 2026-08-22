import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/adminService";
import { AdminCourseFilter, UserFilter } from "../services/adminService";
import { logger } from "../utils/logger";

// ---- Duyệt khóa học ----

export async function listCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = req.validatedQuery as unknown as AdminCourseFilter;
    const [{ items, meta }, counts] = await Promise.all([
      adminService.listCourses(filter),
      adminService.countCoursesByStatus(),
    ]);
    res.json({ success: true, data: items, meta, counts });
  } catch (err) {
    next(err);
  }
}

export async function publishCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.publishCourse(Number(req.params.id));
    logger.info({ courseId: data.id, adminId: req.user!.id }, "Course published");
    res.json({ success: true, message: "Đã duyệt và công khai khóa học", data });
  } catch (err) {
    next(err);
  }
}

export async function rejectCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.rejectCourse(Number(req.params.id), req.body.reason);
    logger.info({ courseId: data.id, adminId: req.user!.id }, "Course rejected");
    res.json({ success: true, message: "Đã từ chối khóa học", data });
  } catch (err) {
    next(err);
  }
}

export async function unpublishCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.unpublishCourse(Number(req.params.id), req.body.reason);
    logger.info({ courseId: data.id, adminId: req.user!.id }, "Course unpublished");
    res.json({ success: true, message: "Đã gỡ khóa học khỏi trang công khai", data });
  } catch (err) {
    next(err);
  }
}

// ---- Người dùng ----

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = req.validatedQuery as unknown as UserFilter;
    const { items, meta } = await adminService.listUsers(filter);
    res.json({ success: true, data: items, meta });
  } catch (err) {
    next(err);
  }
}

export async function setUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.setUserStatus(
      Number(req.params.id),
      req.body.isActive,
      req.user!
    );
    logger.info({ targetUserId: data.id, isActive: data.isActive, adminId: req.user!.id }, "User status changed");
    res.json({
      success: true,
      message: data.isActive ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
      data,
    });
  } catch (err) {
    next(err);
  }
}

// ---- Thống kê ----

export async function getOverviewStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getOverviewStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
