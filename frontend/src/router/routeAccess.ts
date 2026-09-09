import type { UserRole } from "../types/api";

/**
 * Bảng quyền theo tiền tố đường dẫn.
 *
 * Chú ý về phạm vi: bảng này KHÔNG phải nơi thực thi quyền. Việc chặn vẫn do
 * <ProtectedRoute roles={...}> làm, và quyền sở hữu dữ liệu do API kiểm. Bảng
 * này chỉ trả lời một câu hỏi về trải nghiệm: sau khi đăng nhập, có nên quay
 * lại đúng trang người dùng đang muốn xem hay không.
 *
 * Nhờ vậy, nếu bảng này lạc hậu so với router thì hậu quả xấu nhất chỉ là người
 * dùng về /dashboard thay vì quay lại trang cũ — không có rủi ro bảo mật.
 */
const RULES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/instructor", roles: ["instructor", "admin"] },
  { prefix: "/my-courses", roles: ["student"] },
  { prefix: "/learn", roles: ["student"] },
  { prefix: "/quiz", roles: ["student"] },
  { prefix: "/quiz-result", roles: ["student"] },
];

/** Những đường dẫn không đáng quay lại sau khi đăng nhập. */
const NEVER_RETURN = ["/login", "/register", "/403", "/404"];

/**
 * Sau khi đăng nhập, có nên điều hướng về `from` không?
 * Trả về false nếu `from` không hợp lệ, là trang đăng nhập, hoặc vai trò mới
 * không có quyền với nó.
 */
export function shouldReturnTo(from: string | undefined, role: UserRole): boolean {
  if (!from || !from.startsWith("/")) return false;
  if (NEVER_RETURN.some((p) => from === p || from.startsWith(p + "/"))) return false;

  const rule = RULES.find((r) => from === r.prefix || from.startsWith(r.prefix + "/"));
  return rule ? rule.roles.includes(role) : true;
}
