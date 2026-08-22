/**
 * Máy trạng thái vòng đời khóa học - HÀM THUẦN, không đụng CSDL.
 *
 *        ┌────────────── submit ──────────────┐
 *        │                                    ▼
 *     draft ◄── unpublish ── published ◄── publish ── pending
 *        ▲                                    │
 *        └── submit ── rejected ◄── reject ───┘
 *
 * Gom toàn bộ luật chuyển trạng thái vào MỘT chỗ thay vì rải if/else
 * trong từng service: thêm trạng thái mới chỉ phải sửa một bảng,
 * và kiểm thử được đầy đủ mọi tổ hợp mà không cần cơ sở dữ liệu.
 */

export type CourseStatus = "draft" | "pending" | "published" | "rejected";
export type CourseAction = "submit" | "publish" | "reject" | "unpublish";

interface Transition {
  from: CourseStatus[];
  to: CourseStatus;
  /** Ai được phép thực hiện - chỉ để hiển thị trong thông báo lỗi. */
  actor: string;
}

const TRANSITIONS: Record<CourseAction, Transition> = {
  submit: { from: ["draft", "rejected"], to: "pending", actor: "giảng viên" },
  publish: { from: ["pending"], to: "published", actor: "quản trị viên" },
  reject: { from: ["pending"], to: "rejected", actor: "quản trị viên" },
  unpublish: { from: ["published"], to: "draft", actor: "quản trị viên" },
};

export const STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "Bản nháp",
  pending: "Chờ duyệt",
  published: "Đang hiển thị công khai",
  rejected: "Bị từ chối",
};

export function canTransition(current: CourseStatus, action: CourseAction): boolean {
  return TRANSITIONS[action].from.includes(current);
}

export function nextStatus(action: CourseAction): CourseStatus {
  return TRANSITIONS[action].to;
}

/** Thông báo tiếng Việt giải thích vì sao thao tác bị từ chối. */
export function explainRefusal(current: CourseStatus, action: CourseAction): string {
  const t = TRANSITIONS[action];
  const allowed = t.from.map((s) => STATUS_LABEL[s]).join(" hoặc ");
  return `Khóa học đang ở trạng thái "${STATUS_LABEL[current]}". Thao tác này chỉ thực hiện được khi khóa học ở trạng thái ${allowed}.`;
}

/** Danh sách thao tác hợp lệ tại một trạng thái - dùng để bật/tắt nút trên giao diện. */
export function availableActions(current: CourseStatus): CourseAction[] {
  return (Object.keys(TRANSITIONS) as CourseAction[]).filter((a) => canTransition(current, a));
}
