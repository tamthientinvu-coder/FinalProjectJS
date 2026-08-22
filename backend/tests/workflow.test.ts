/**
 * Kiểm thử máy trạng thái vòng đời khóa học - hàm thuần, không cần CSDL.
 * Duyệt ĐỦ 16 tổ hợp (4 trạng thái × 4 thao tác) để không sót nhánh nào.
 */
import {
  canTransition,
  nextStatus,
  availableActions,
  explainRefusal,
  type CourseAction,
  type CourseStatus,
} from "../src/services/courseWorkflow";
import { equal, ok, section, report } from "./helpers/assert";

const STATUSES: CourseStatus[] = ["draft", "pending", "published", "rejected"];
const ACTIONS: CourseAction[] = ["submit", "publish", "reject", "unpublish"];

/** Bảng chân lý viết tay, độc lập với cài đặt - nếu code đổi luật, test phải đỏ. */
const EXPECTED: Record<CourseStatus, Record<CourseAction, boolean>> = {
  draft: { submit: true, publish: false, reject: false, unpublish: false },
  pending: { submit: false, publish: true, reject: true, unpublish: false },
  published: { submit: false, publish: false, reject: false, unpublish: true },
  rejected: { submit: true, publish: false, reject: false, unpublish: false },
};

section("Bảng chuyển trạng thái - đủ 16 tổ hợp");
for (const status of STATUSES) {
  for (const action of ACTIONS) {
    const expected = EXPECTED[status][action];
    ok(
      `${status} + ${action} -> ${expected ? "cho phép" : "chặn"}`,
      canTransition(status, action) === expected
    );
  }
}

section("Trạng thái đích của mỗi thao tác");
equal("submit -> pending", nextStatus("submit"), "pending");
equal("publish -> published", nextStatus("publish"), "published");
equal("reject -> rejected", nextStatus("reject"), "rejected");
equal("unpublish -> draft", nextStatus("unpublish"), "draft");

section("Thao tác khả dụng tại mỗi trạng thái (dùng để bật/tắt nút)");
equal("draft", availableActions("draft"), ["submit"]);
equal("pending", availableActions("pending"), ["publish", "reject"]);
equal("published", availableActions("published"), ["unpublish"]);
equal("rejected", availableActions("rejected"), ["submit"]);

section("Thông báo từ chối bằng tiếng Việt");
ok(
  "nêu rõ trạng thái hiện tại",
  explainRefusal("draft", "publish").includes("Bản nháp")
);
ok(
  "nêu rõ trạng thái được phép",
  explainRefusal("draft", "publish").includes("Chờ duyệt")
);
ok(
  "không lộ tên trạng thái kỹ thuật cho người dùng cuối",
  !explainRefusal("draft", "publish").includes("pending")
);

section("Không có đường vòng ngoài ý muốn");
ok(
  "không thể công khai thẳng từ bản nháp",
  !canTransition("draft", "publish")
);
ok(
  "không thể từ chối một khóa đã công khai",
  !canTransition("published", "reject")
);
ok(
  "khóa bị từ chối phải gửi duyệt lại, không tự công khai",
  !canTransition("rejected", "publish") && canTransition("rejected", "submit")
);

report("workflow.test.ts");
