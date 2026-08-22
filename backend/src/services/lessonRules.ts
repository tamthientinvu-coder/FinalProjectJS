/**
 * Luật lộ trình học - HÀM THUẦN, không phụ thuộc CSDL hay HTTP.
 *
 * Đặt ở module riêng (không import prisma) để tầng kiểm thử nạp được
 * mà không kéo theo cả PrismaClient. Đây là lý do file test chạy được
 * trong vài chục mili giây và không cần dựng cơ sở dữ liệu.
 */

/**
 * Tính xem từng bài học đã được mở khóa chưa.
 *
 * Quy tắc của đề tài: học theo thứ tự - bài đầu tiên luôn mở,
 * bài thứ N chỉ mở khi đã hoàn thành TẤT CẢ các bài đứng trước nó.
 *
 * @param lessons     danh sách bài học (không cần sắp xếp sẵn)
 * @param completedIds tập id các bài đã đánh dấu hoàn thành
 * @param bypass      true = bỏ qua khóa lộ trình (giảng viên, admin xem trước)
 */
export function computeUnlock(
  lessons: { id: number; order: number }[],
  completedIds: Set<number>,
  bypass: boolean
): Map<number, boolean> {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const unlocked = new Map<number, boolean>();

  // Nếu chỉ xét đúng bài liền trước, học viên bỏ đánh dấu bài 1 sau khi đã
  // học hết sẽ rơi vào trạng thái vô lý: bài 2 bị khóa nhưng bài 3 vẫn mở.
  let allPreviousCompleted = true;
  for (const lesson of sorted) {
    unlocked.set(lesson.id, bypass || allPreviousCompleted);
    allPreviousCompleted = allPreviousCompleted && completedIds.has(lesson.id);
  }
  return unlocked;
}
