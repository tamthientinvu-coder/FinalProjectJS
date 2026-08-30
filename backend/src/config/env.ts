import dotenv from "dotenv";

dotenv.config();

/**
 * Đọc biến môi trường bắt buộc. Thiếu -> crash NGAY khi khởi động,
 * thay vì chạy được rồi lỗi 500 giữa chừng lúc demo.
 */
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] Thiếu biến môi trường bắt buộc: ${key}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? "7d",
  },
  feUrl: process.env.FE_URL ?? "http://localhost:5173",
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",
  },
};
