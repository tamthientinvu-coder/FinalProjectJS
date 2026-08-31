import { describe, expect, it } from "vitest";
import { formatQuizScore } from "./formatQuizScore";

describe("formatQuizScore", () => {
  it("hiển thị Chưa có khi học viên chưa làm quiz", () => {
    expect(formatQuizScore(null)).toBe("Chưa có");
  });

  it("hiển thị điểm trên thang 100", () => {
    expect(formatQuizScore(70)).toBe("70/100");
  });
});
