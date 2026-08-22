import axiosClient from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { Category } from "../types/course";

export const categoryApi = {
  list: () => axiosClient.get<ApiResponse<Category[]>>("/categories"),

  create: (payload: { name: string; slug?: string }) =>
    axiosClient.post<ApiResponse<Category>>("/categories", payload),

  update: (id: number, payload: { name?: string; slug?: string }) =>
    axiosClient.patch<ApiResponse<Category>>(`/categories/${id}`, payload),

  remove: (id: number) => axiosClient.delete<ApiResponse<null>>(`/categories/${id}`),
};
