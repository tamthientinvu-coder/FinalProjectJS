export type UserRole = "student" | "instructor" | "admin";
export type CourseStatus = "draft" | "pending" | "published" | "rejected";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
      };
      /** Query string đã được validateQuery làm sạch và ép kiểu. */
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export interface AccessTokenPayload {
  id: number;
  email: string;
  role: UserRole;
}

/** Mọi response của API đều theo đúng 1 khuôn dạng này. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PageMeta;
  errors?: Record<string, string>;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Lỗi có chủ đích (nghiệp vụ) - phân biệt với lỗi hệ thống 500. */
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
