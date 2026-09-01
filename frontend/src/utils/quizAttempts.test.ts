import { describe, expect, it } from "vitest";
import { canRetryQuiz } from "./quizAttempts";

describe("canRetryQuiz", () => {
  it("không cho làm lại sau khi đã đạt", () => {
    expect(canRetryQuiz({ passed: true, attemptNo: 1 }, null)).toBe(false);
  });

  it("cho làm lại khi chưa đạt và còn lượt", () => {
    expect(canRetryQuiz({ passed: false, attemptNo: 1 }, 2)).toBe(true);
  });

  it("không cho làm lại khi đã hết lượt", () => {
    expect(canRetryQuiz({ passed: false, attemptNo: 2 }, 2)).toBe(false);
  });
});
