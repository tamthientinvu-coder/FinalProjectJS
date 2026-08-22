export type UserRole = "student" | "instructor" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Khuôn dạng chung của mọi response từ backend. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PageMeta;
}

export interface ApiErrorResponse {
  success: false;
  message?: string;
  errors?: Record<string, string>;
}

export interface LoginResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}
