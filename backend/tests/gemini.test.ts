/**
 * Kiểm thử lớp giao tiếp với Gemini bằng cách thay `fetch` toàn cục.
 * Không gọi mạng thật -> chạy được offline, không tốn hạn mức API.
 */
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.GEMINI_API_KEY = "test-key-123";

import { env } from "../src/config/env";
import { generateText, generateJson, isConfigured } from "../src/services/geminiClient";
import { ok, equal, expectError, section, report } from "./helpers/assert";

type FetchArgs = { url: string; init: RequestInit };
let lastCall: FetchArgs | null = null;

/** Thay fetch toàn cục bằng bản giả lập trả về đúng thứ mình muốn. */
function stubFetch(handler: (args: FetchArgs) => Promise<Response> | Response) {
  (globalThis as unknown as { fetch: unknown }).fetch = async (url: string, init: RequestInit) => {
    lastCall = { url, init };
    return handler({ url, init });
  };
}

const geminiOk = (text: string) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });

(async () => {
  section("A. Cấu hình");
  ok("có API key -> isConfigured() = true", isConfigured() === true);

  env.gemini.apiKey = "";
  await expectError(
    "thiếu API key -> 503 kèm thông báo rõ ràng",
    () => generateText("xin chào"),
    503,
    "GEMINI_API_KEY"
  );
  ok("thiếu API key -> isConfigured() = false", isConfigured() === false);
  env.gemini.apiKey = "test-key-123";

  section("B. Gọi thành công");
  stubFetch(() => geminiOk("  Đây là câu trả lời.  "));
  equal("trả về văn bản đã cắt khoảng trắng", await generateText("hỏi gì đó"), "Đây là câu trả lời.");

  ok("API key nằm ở HEADER, không nằm trong URL",
    !String(lastCall?.url).includes("test-key-123") &&
      (lastCall?.init.headers as Record<string, string>)["x-goog-api-key"] === "test-key-123",
    `\n      url: ${lastCall?.url}`);
  ok("gọi đúng model trong biến môi trường", String(lastCall?.url).includes(env.gemini.model));
  ok("có truyền AbortSignal để chặn treo vô hạn", Boolean(lastCall?.init.signal));

  section("C. Xử lý JSON");
  stubFetch(() => geminiOk('{"questions":[{"text":"a"}]}'));
  equal("JSON thuần -> parse được", await generateJson("x", {}), { questions: [{ text: "a" }] });

  stubFetch(() => geminiOk('```json\n{"ok":true}\n```'));
  equal("JSON bọc trong khối ```json -> vẫn parse được", await generateJson("x", {}), { ok: true });

  stubFetch(() => geminiOk("đây không phải JSON"));
  await expectError("JSON hỏng -> 502", () => generateJson("x", {}), 502, "không đúng định dạng");

  section("D. Xử lý lỗi từ dịch vụ");
  stubFetch(() => new Response("quota exceeded", { status: 429 }));
  await expectError("429 -> báo quá tải", () => generateText("x"), 429, "quá tải");

  stubFetch(() => new Response("invalid key", { status: 403 }));
  await expectError("403 -> báo cấu hình sai", () => generateText("x"), 503, "GEMINI_API_KEY");

  stubFetch(() => new Response("boom", { status: 500 }));
  await expectError("500 -> 502", () => generateText("x"), 502);

  stubFetch(() => new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 }));
  await expectError("bị bộ lọc an toàn chặn -> 422", () => generateText("x"), 422, "bộ lọc an toàn");

  stubFetch(() => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
  await expectError("không có nội dung -> 502", () => generateText("x"), 502, "không trả về nội dung");

  section("E. Sự cố mạng và quá thời gian");
  stubFetch(() => {
    throw new Error("ECONNREFUSED");
  });
  await expectError("mất mạng -> 504", () => generateText("x"), 504, "Không kết nối được");

  stubFetch(() => {
    const err = new Error("aborted");
    err.name = "AbortError";
    throw err;
  });
  await expectError("quá thời gian chờ -> 504", () => generateText("x"), 504, "quá lâu");

  section("F. Không lộ chi tiết lỗi ra người dùng");
  stubFetch(() => new Response("API key AIzaSyXXXX bị lộ trong body lỗi", { status: 500 }));
  try {
    await generateText("x");
  } catch (e) {
    const message = String((e as Error).message);
    ok("thông báo lỗi KHÔNG chứa chi tiết nội bộ từ nhà cung cấp", !message.includes("AIzaSy"));
  }

  report("gemini.test.ts");
})().catch((e) => {
  console.error("LỖI NGOÀI DỰ KIẾN:", e);
  process.exit(1);
});
