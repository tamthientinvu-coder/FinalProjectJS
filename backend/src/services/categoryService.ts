import prisma from "../utils/prisma";
import { slugify } from "../utils/slugify";
import { AppError } from "../types/api";

/**
 * Danh sách danh mục kèm TỔNG số khóa học của từng danh mục (mọi trạng thái).
 * Đếm tất cả chứ không riêng khóa đã duyệt, vì con số này còn dùng để
 * quyết định có cho xóa danh mục hay không.
 */
export async function list() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courses: true } },
    },
  });
  return categories;
}

export async function getById(id: number) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { courses: true } } },
  });
  if (!category) throw new AppError(404, "Không tìm thấy danh mục");
  return category;
}

export async function create(input: { name: string; slug?: string }) {
  // Slug bỏ trống -> tự sinh từ tên. Tên toàn ký tự lạ -> slug rỗng -> phải báo lỗi.
  const slug = input.slug?.trim() ? input.slug.trim() : slugify(input.name);
  if (!slug) {
    throw new AppError(400, "Không tạo được slug từ tên này, vui lòng nhập slug thủ công");
  }

  const existed = await prisma.category.findUnique({ where: { slug } });
  if (existed) throw new AppError(409, `Slug "${slug}" đã được sử dụng`);

  return prisma.category.create({ data: { name: input.name, slug } });
}

export async function update(id: number, input: { name?: string; slug?: string }) {
  await getById(id);

  const data: { name?: string; slug?: string } = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined && input.slug.trim()) data.slug = input.slug.trim();

  if (data.slug) {
    const existed = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existed && existed.id !== id) throw new AppError(409, `Slug "${data.slug}" đã được sử dụng`);
  }

  return prisma.category.update({ where: { id }, data });
}

export async function remove(id: number) {
  const category = await getById(id);

  // Chặn ở tầng ứng dụng: xóa danh mục đang dùng sẽ làm khóa học mất phân loại.
  // (Tầng CSDL còn một lưới an toàn nữa là onDelete: SetNull.)
  if (category._count.courses > 0) {
    throw new AppError(
      409,
      `Danh mục đang có ${category._count.courses} khóa học, hãy chuyển các khóa học sang danh mục khác trước khi xóa`
    );
  }

  await prisma.category.delete({ where: { id } });
}
