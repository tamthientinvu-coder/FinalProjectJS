import * as yup from "yup";

export const createLessonSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Tên bài học không được để trống")
    .min(3, "Tên bài học tối thiểu 3 ký tự")
    .max(200, "Tên bài học tối đa 200 ký tự"),
  content: yup.string().trim().max(50000, "Nội dung tối đa 50.000 ký tự").optional(),
  videoUrl: yup
    .string()
    .trim()
    .url("Link video phải là URL hợp lệ")
    .max(500)
    .optional()
    .nullable(),
  // Bỏ trống thì server tự xếp vào cuối khóa học
  order: yup.number().typeError("Thứ tự phải là số").integer().min(1, "Thứ tự phải từ 1 trở lên").optional(),
});

export const updateLessonSchema = yup.object({
  title: yup.string().trim().min(3, "Tên bài học tối thiểu 3 ký tự").max(200).optional(),
  content: yup.string().trim().max(50000, "Nội dung tối đa 50.000 ký tự").optional().nullable(),
  videoUrl: yup.string().trim().url("Link video phải là URL hợp lệ").max(500).optional().nullable(),
});

/**
 * Đổi thứ tự bài học.
 * Bắt buộc gửi TOÀN BỘ bài học của khóa: nếu chỉ gửi một phần, những bài
 * không gửi vẫn giữ order cũ và có thể đụng độ với order mới -> vi phạm
 * ràng buộc @@unique([courseId, order]).
 */
export const reorderLessonSchema = yup.object({
  items: yup
    .array()
    .of(
      yup.object({
        id: yup.number().typeError("Id bài học không hợp lệ").integer().positive().required(),
        order: yup.number().typeError("Thứ tự không hợp lệ").integer().min(1).required(),
      })
    )
    .min(1, "Danh sách sắp xếp không được rỗng")
    .required("Thiếu danh sách sắp xếp"),
});

export const completeLessonSchema = yup.object({
  // Cho phép bỏ đánh dấu để học viên sửa khi lỡ tay
  isCompleted: yup.boolean().default(true),
});
