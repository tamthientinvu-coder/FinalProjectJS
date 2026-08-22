import * as yup from "yup";

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Họ tên không được để trống")
    .min(2, "Họ tên tối thiểu 2 ký tự")
    .max(100, "Họ tên tối đa 100 ký tự"),
  email: yup
    .string()
    .trim()
    .lowercase()
    .required("Email không được để trống")
    .email("Email không đúng định dạng"),
  password: yup
    .string()
    .required("Mật khẩu không được để trống")
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  // Chỉ cho tự đăng ký student/instructor. Admin do seed hoặc admin khác tạo.
  role: yup
    .string()
    .oneOf(["student", "instructor"], "Vai trò chỉ được là student hoặc instructor")
    .default("student"),
});

export const loginSchema = yup.object({
  email: yup.string().trim().lowercase().required("Email không được để trống").email("Email không đúng định dạng"),
  password: yup.string().required("Mật khẩu không được để trống"),
});

export const refreshSchema = yup.object({
  refreshToken: yup.string().required("Thiếu refreshToken"),
});
