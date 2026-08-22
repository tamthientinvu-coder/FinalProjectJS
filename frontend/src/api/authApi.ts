import axiosClient from "./axiosClient";
import type { ApiResponse, LoginResult, User, UserRole } from "../types/api";

export const authApi = {
  register: (payload: { name: string; email: string; password: string; role: UserRole }) =>
    axiosClient.post<ApiResponse<User>>("/auth/register", payload),

  login: (payload: { email: string; password: string }) =>
    axiosClient.post<ApiResponse<LoginResult>>("/auth/login", payload),

  logout: () => axiosClient.post<ApiResponse<null>>("/auth/logout"),

  getMe: () => axiosClient.get<ApiResponse<User>>("/auth/me"),
};
