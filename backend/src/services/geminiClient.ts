import { env } from "../config/env";
import { AppError } from "../types/api";
import { logger } from "../utils/logger";

/**
 * Lớp giao tiếp với Google Gemini.
 *
 * Gọi thẳng REST API bằng `fetch` có sẵn của Node 22 thay vì cài thêm SDK:
 * ít phụ thuộc hơn, và quan trọng là dễ thay bằng bản giả lập khi kiểm thử.
 *
 * API key CHỈ tồn tại ở biến môi trường của server. Frontend không bao giờ
 * thấy key này - mọi lời gọi AI đều đi vòng qua backend.
 */

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";
const TIMEOUT_MS = 20_000;

export function isConfigured(): boolean {
  return Boolean(env.gemini.apiKey);
}

interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
  /** Bắt Gemini trả về JSON đúng cấu trúc, thay vì để nó tự do viết văn. */
  responseSchema?: Record<string, unknown>;
}

async function callGemini(prompt: string, options: GenerateOptions): Promise<string> {
  if (!isConfigured()) {
    throw new AppError(
      503,
      "Tính năng AI chưa sẵn sàng: máy chủ chưa được cấu hình GEMINI_API_KEY"
    );
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      ...(options.responseSchema
        ? { responseMimeType: "application/json", responseSchema: options.responseSchema }
        : {}),
    },
  };

  // Không có timeout thì một lần Gemini treo sẽ giữ luôn kết nối của người dùng
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_ROOT}/${env.gemini.model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Đặt key ở header thay vì query string để không lọt vào log truy cập
        "x-goog-api-key": env.gemini.apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "Gemini request failed");
    throw new AppError(
      504,
      isAbort ? "AI phản hồi quá lâu, vui lòng thử lại" : "Không kết nối được tới dịch vụ AI"
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    // Chỉ log chi tiết ở server; người dùng nhận thông báo chung
    logger.error({ status: response.status, detail: detail.slice(0, 500) }, "Gemini returned error");

    if (response.status === 429) {
      throw new AppError(429, "Dịch vụ AI đang quá tải hoặc hết hạn mức, vui lòng thử lại sau");
    }
    if (response.status === 400 || response.status === 403) {
      throw new AppError(503, "Cấu hình AI không hợp lệ (kiểm tra lại GEMINI_API_KEY và tên model)");
    }
    throw new AppError(502, "Dịch vụ AI trả về lỗi, vui lòng thử lại sau");
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (payload.promptFeedback?.blockReason) {
    throw new AppError(422, "Nội dung bị bộ lọc an toàn của AI từ chối xử lý");
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    logger.warn({ payload: JSON.stringify(payload).slice(0, 300) }, "Gemini returned empty content");
    throw new AppError(502, "AI không trả về nội dung nào");
  }
  return text;
}

/** Sinh văn bản tự do (dùng cho tóm tắt, giải thích). */
export async function generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
  const text = await callGemini(prompt, options);
  return text.trim();
}

/**
 * Sinh JSON theo cấu trúc yêu cầu.
 *
 * KHÔNG tin tưởng đầu ra: dù đã khai báo responseSchema, mô hình vẫn có thể
 * bọc JSON trong khối ```json hoặc trả chuỗi hỏng. Hàm này gỡ khối mã và
 * ném lỗi rõ ràng nếu không parse được; tầng gọi còn phải validate lần nữa
 * bằng đúng schema Yup dùng cho dữ liệu người dùng nhập.
 */
export async function generateJson<T>(
  prompt: string,
  responseSchema: Record<string, unknown>,
  options: GenerateOptions = {}
): Promise<T> {
  const raw = await callGemini(prompt, { ...options, responseSchema });

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    logger.warn({ raw: cleaned.slice(0, 300) }, "Gemini returned non-JSON payload");
    throw new AppError(502, "AI trả về dữ liệu không đúng định dạng, vui lòng thử lại");
  }
}
