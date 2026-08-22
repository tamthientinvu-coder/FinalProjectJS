import { Request, Response, NextFunction } from "express";
import * as categoryService from "../services/categoryService";

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.list();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.create(req.body);
    res.status(201).json({ success: true, message: "Tạo danh mục thành công", data });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await categoryService.update(Number(req.params.id), req.body);
    res.json({ success: true, message: "Cập nhật danh mục thành công", data });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await categoryService.remove(Number(req.params.id));
    res.json({ success: true, message: "Đã xóa danh mục" });
  } catch (err) {
    next(err);
  }
}
