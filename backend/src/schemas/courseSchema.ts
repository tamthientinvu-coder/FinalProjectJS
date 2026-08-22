import * as yup from "yup";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const createCourseSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Tên khóa học không được để trống")
    .min(5, "Tên khóa học tối thiểu 5 ký tự")
    .max(200, "Tên khóa học tối đa 200 ký tự"),
  description: yup.string().trim().max(5000, "Mô tả tối đa 5000 ký tự").optional(),
  thumbnail: yup
    .string()
    .trim()
    .url("Ảnh bìa phải là một URL hợp lệ")
    .max(500)
    .optional()
    .nullable(),
  categoryId: yup
    .number()
    .typeError("Danh mục không hợp lệ")
    .integer()
    .positive()
    .optional()
    .nullable(),
  level: yup
    .string()
    .oneOf(LEVELS, "Độ khó chỉ được là beginner, intermediate hoặc advanced")
    .default("beginner"),
});

/**
 * Update dùng schema riêng: mọi field optional để hỗ trợ PATCH từng phần.
 * KHÔNG có field status - đổi trạng thái phải đi qua endpoint riêng
 * (submit / publish / reject), không cho sửa lẫn với nội dung.
 */
export const updateCourseSchema = yup.object({
  title: yup.string().trim().min(5, "Tên khóa học tối thiểu 5 ký tự").max(200).optional(),
  description: yup.string().trim().max(5000).optional().nullable(),
  thumbnail: yup.string().trim().url("Ảnh bìa phải là một URL hợp lệ").max(500).optional().nullable(),
  categoryId: yup.number().typeError("Danh mục không hợp lệ").integer().positive().optional().nullable(),
  level: yup.string().oneOf(LEVELS, "Độ khó không hợp lệ").optional(),
});

/**
 * Bộ lọc cho GET /courses. Ép kiểu số ngay tại đây để service nhận dữ liệu sạch.
 *
 * emptyToUndefined: query string luôn là chuỗi, nên "?level=" gửi lên là "" chứ
 * không phải undefined. Không xử lý thì oneOf() sẽ báo lỗi 400 dù người dùng
 * chỉ đang bỏ chọn bộ lọc.
 */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const courseQuerySchema = yup.object({
  category: yup.string().trim().lowercase().transform(emptyToUndefined).optional(),
  level: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf([...LEVELS, undefined], "Độ khó không hợp lệ")
    .optional(),
  search: yup.string().trim().max(200).transform(emptyToUndefined).optional(),
  sort: yup
    .string()
    .transform(emptyToUndefined)
    .oneOf(["newest", "oldest", "title"], "Kiểu sắp xếp không hợp lệ")
    .default("newest"),
  page: yup.number().integer().min(1, "Trang phải lớn hơn 0").default(1),
  limit: yup.number().integer().min(1).max(50, "Mỗi trang tối đa 50 khóa học").default(9),
});
