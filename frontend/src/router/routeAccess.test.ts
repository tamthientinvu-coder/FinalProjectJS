import { describe, expect, it } from "vitest";
import { shouldReturnTo } from "./routeAccess";

describe("shouldReturnTo", () => {
  it("không quay lại khi không có trang nào đang chờ", () => {
    expect(shouldReturnTo(undefined, "student")).toBe(false);
  });

  it("không quay lại chính trang đăng nhập hay đăng ký", () => {
    expect(shouldReturnTo("/login", "student")).toBe(false);
    expect(shouldReturnTo("/register", "instructor")).toBe(false);
    expect(shouldReturnTo("/403", "admin")).toBe(false);
  });

  it("quay lại đúng khu vực của vai trò", () => {
    expect(shouldReturnTo("/my-courses", "student")).toBe(true);
    expect(shouldReturnTo("/instructor/courses", "instructor")).toBe(true);
    expect(shouldReturnTo("/admin/users", "admin")).toBe(true);
  });

  it("không quay lại khu vực vai trò mới không có quyền", () => {
    expect(shouldReturnTo("/admin/users", "student")).toBe(false);
    expect(shouldReturnTo("/admin/users", "instructor")).toBe(false);
    expect(shouldReturnTo("/my-courses", "instructor")).toBe(false);
    expect(shouldReturnTo("/instructor/courses", "student")).toBe(false);
  });

  it("quản trị vào được khu giảng viên, đúng như ma trận quyền", () => {
    expect(shouldReturnTo("/instructor/courses", "admin")).toBe(true);
  });

  it("trang chung chỉ cần đăng nhập thì vai nào cũng quay lại được", () => {
    expect(shouldReturnTo("/dashboard", "student")).toBe(true);
    expect(shouldReturnTo("/courses/26", "instructor")).toBe(true);
  });

  it("bỏ qua đường dẫn tuyệt đối ra ngoài ứng dụng", () => {
    expect(shouldReturnTo("https://example.com/phishing", "admin")).toBe(false);
  });
});
