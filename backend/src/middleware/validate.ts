import { Request, Response, NextFunction } from "express";
import * as yup from "yup";

/** Validate req.body theo schema Yup; stripUnknown loại field lạ (chống mass-assignment). */
export const validate = (schema: yup.AnyObjectSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.validate(req.body, { abortEarly: false, stripUnknown: true });
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate query string (filter/paging).
 * Kết quả đặt ở req.validatedQuery chứ không ghi đè req.query,
 * để tương thích với Express 5 (req.query là thuộc tính chỉ đọc).
 */
export const validateQuery = (schema: yup.AnyObjectSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.validatedQuery = await schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
