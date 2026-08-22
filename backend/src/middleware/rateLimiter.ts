import rateLimit from "express-rate-limit";

/** Chống brute-force mật khẩu (Bài 6 - App Security). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Bạn thử quá nhiều lần, vui lòng đợi 15 phút" },
});

/** Gemini tính tiền theo request -> phải chặn lạm dụng. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Bạn gọi AI quá nhanh, vui lòng thử lại sau 1 phút" },
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
