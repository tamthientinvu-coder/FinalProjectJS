import { describe, expect, it } from "vitest";
import { resolveApiUrl } from "./apiUrl";

describe("resolveApiUrl", () => {
  it("chuẩn hóa URL hợp lệ và bỏ dấu slash cuối", () => {
    expect(resolveApiUrl("https://learnquiz-api.onrender.com/api/v1/")).toBe(
      "https://learnquiz-api.onrender.com/api/v1"
    );
  });

  it("chặn URL placeholder của Vercel", () => {
    expect(() =>
      resolveApiUrl("https://<link-backend-cua-ban>.onrender.com/api/v1")
    ).toThrow("VITE_API_URL không hợp lệ");
  });

  it("chặn URL thiếu protocol", () => {
    expect(() => resolveApiUrl("learnquiz-api.onrender.com/api/v1")).toThrow(
      "VITE_API_URL không hợp lệ"
    );
  });

  it("chặn thiếu VITE_API_URL ở production", () => {
    expect(() => resolveApiUrl(undefined, true)).toThrow(
      "VITE_API_URL bắt buộc ở production"
    );
  });

  it("chặn URL không trỏ tới /api/v1", () => {
    expect(() =>
      resolveApiUrl("https://learnquiz-api.onrender.com", true)
    ).toThrow("phải kết thúc bằng /api/v1");
  });

  it("chặn HTTP ở production để tránh mixed content", () => {
    expect(() =>
      resolveApiUrl("http://learnquiz-api.onrender.com/api/v1", true)
    ).toThrow("phải dùng HTTPS");
  });
});
