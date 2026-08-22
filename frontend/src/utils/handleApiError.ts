import axios from "axios";
import type { ApiErrorResponse } from "../types/api";

/** Quy về 1 chuỗi tiếng Việt để hiển thị cho người dùng. */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;

    // Lỗi validate từ Yup phía backend: { errors: { email: "..." } }
    if (data?.errors && Object.keys(data.errors).length > 0) {
      return Object.values(data.errors).join(" · ");
    }
    if (data?.message) return data.message;

    const fallback: Record<number, string> = {
      400: "Dữ liệu gửi lên không hợp lệ",
      401: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
      403: "Bạn không có quyền thực hiện thao tác này",
      404: "Không tìm thấy dữ liệu yêu cầu",
      409: "Dữ liệu đã tồn tại",
      429: "Bạn thao tác quá nhanh, vui lòng thử lại sau",
      500: "Lỗi máy chủ, vui lòng thử lại sau",
    };
    if (error.response) return fallback[error.response.status] ?? "Có lỗi xảy ra";
    if (error.request) return "Không kết nối được tới máy chủ. Backend đã chạy chưa?";
  }
  if (error instanceof Error) return error.message;
  return "Có lỗi không xác định";
}
