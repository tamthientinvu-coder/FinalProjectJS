/**
 * Chuyển tên danh mục tiếng Việt thành slug dùng trong URL.
 * "Lập trình Web" -> "lap-trinh-web"
 *
 * normalize("NFD") tách chữ và dấu thành 2 ký tự riêng,
 * sau đó xóa toàn bộ dấu bằng dải Unicode ̀-ͯ.
 * Riêng chữ đ/Đ không có dạng tách dấu nên phải thay thủ công.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
