import * as yup from "yup";

export const createCategorySchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Tên danh mục không được để trống")
    .min(2, "Tên danh mục tối thiểu 2 ký tự")
    .max(100, "Tên danh mục tối đa 100 ký tự"),
  // Không bắt buộc: bỏ trống thì server tự sinh slug từ name
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    .max(100, "Slug tối đa 100 ký tự")
    .optional(),
});

export const updateCategorySchema = yup.object({
  name: yup.string().trim().min(2, "Tên danh mục tối thiểu 2 ký tự").max(100).optional(),
  slug: yup
    .string()
    .trim()
    .lowercase()
    .matches(/^[a-z0-9-]*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang")
    .max(100)
    .optional(),
});
