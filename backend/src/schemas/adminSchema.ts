import * as yup from "yup";

const COURSE_STATUSES = ["draft", "pending", "published", "rejected"] as const;
const ROLES = ["student", "instructor", "admin"] as const;

/** Query string luôn là chuỗi, "?status=" gửi lên là "" chứ không phải undefined. */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

// ---------------- Duyệt khóa học ----------------

export const adminCourseQuerySchema = yup.object({
  status: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf([...COURSE_STATUSES, undefined], "Trạng thái không hợp lệ")
    .optional(),
  search: yup.string().trim().max(200).transform(emptyToUndefined).optional(),
  page: yup.number().integer().min(1, "Trang phải lớn hơn 0").default(1),
  limit: yup.number().integer().min(1).max(50, "Mỗi trang tối đa 50 khóa học").default(10),
});

/**
 * Từ chối khóa học BẮT BUỘC kèm lý do.
 * Giảng viên cần biết phải sửa gì; từ chối không lý do là một cách
 * làm việc thiếu trách nhiệm được ngăn ngay ở tầng validate.
 */
export const rejectCourseSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required("Phải nêu lý do từ chối để giảng viên biết đường sửa")
    .min(10, "Lý do từ chối tối thiểu 10 ký tự")
    .max(500, "Lý do từ chối tối đa 500 ký tự"),
});

export const unpublishCourseSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .required("Phải nêu lý do gỡ khóa học")
    .min(10, "Lý do tối thiểu 10 ký tự")
    .max(500, "Lý do tối đa 500 ký tự"),
});

// ---------------- Quản lý người dùng ----------------

export const userQuerySchema = yup.object({
  role: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf([...ROLES, undefined], "Vai trò không hợp lệ")
    .optional(),
  search: yup.string().trim().max(200).transform(emptyToUndefined).optional(),
  isActive: yup
    .boolean()
    .transform((value, original) => {
      if (original === "" || original === undefined) return undefined;
      if (original === "true") return true;
      if (original === "false") return false;
      return value;
    })
    .optional(),
  page: yup.number().integer().min(1, "Trang phải lớn hơn 0").default(1),
  limit: yup.number().integer().min(1).max(50, "Mỗi trang tối đa 50 người dùng").default(10),
});

export const updateUserStatusSchema = yup.object({
  isActive: yup.boolean().typeError("Trạng thái phải là true hoặc false").required("Thiếu trạng thái"),
});
