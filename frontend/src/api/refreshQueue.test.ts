import { describe, expect, it } from "vitest";
import { RefreshQueue } from "./refreshQueue";

describe("RefreshQueue", () => {
  it("chạy lại toàn bộ request với token mới", async () => {
    const queue = new RefreshQueue();
    const first = queue.wait(async (token) => `first:${token}`);
    const second = queue.wait(async (token) => `second:${token}`);

    queue.flush("new-token");

    await expect(first).resolves.toBe("first:new-token");
    await expect(second).resolves.toBe("second:new-token");
    expect(queue.size).toBe(0);
  });

  it("reject toàn bộ request khi refresh thất bại", async () => {
    const queue = new RefreshQueue();
    const first = queue.wait(async () => "first");
    const second = queue.wait(async () => "second");
    const error = new Error("refresh failed");

    queue.fail(error);

    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    expect(queue.size).toBe(0);
  });
});
