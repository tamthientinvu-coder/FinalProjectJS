/* HTTP thật, chỉ thay Prisma; không truy cập database hoặc dịch vụ ngoài. */
process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.NODE_ENV = "production";
process.env.FE_URL = "https://frontend.example.com";
process.env.GEMINI_API_KEY = "";

import fakePrisma from "./helpers/fakePrisma";
import { equal, ok, report, section } from "./helpers/assert";
import type { AddressInfo } from "node:net";
const prismaPath = require.resolve("../src/utils/prisma");
require.cache[prismaPath] = {
  id: prismaPath, filename: prismaPath, loaded: true,
  exports: { default: fakePrisma, __esModule: true },
} as any;

const app = require("../src/app").default;

(async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    section("HTTP boundary trong production");
    const allowed = await fetch(base + "/health", {
      method: "OPTIONS",
      headers: { Origin: process.env.FE_URL!, "Access-Control-Request-Method": "GET" },
    });
    equal("preflight origin cấu hình -> 204", allowed.status, 204);
    equal("cho phép đúng FE_URL", allowed.headers.get("access-control-allow-origin"), process.env.FE_URL);
    for (const origin of ["http://localhost:5173", "http://localhost:3000", "https://other.example.com"]) {
      const response = await fetch(base + "/health", { headers: { Origin: origin } });
      equal(`không cấp quyền CORS cho ${origin}`, response.headers.get("access-control-allow-origin"), null);
    }
    const health = await fetch(base + "/health");
    equal("health không có Origin vẫn hoạt động", health.status, 200);
    const malformed = await fetch(base + "/api/v1/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: '{"password":"sensitive-marker",',
    });
    equal("JSON sai cú pháp -> 400", malformed.status, 400);
    const malformedBody = await malformed.json() as { success: boolean; message: string };
    equal("JSON lỗi giữ hợp đồng success=false", malformedBody.success, false);
    ok("không phản chiếu password/stack/debug", !JSON.stringify(malformedBody).match(/sensitive-marker|stack|debug/));
    const oversized = await fetch(base + "/api/v1/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "x".repeat(1024 * 1024) }),
    });
    equal("JSON vượt 1 MiB -> 413", oversized.status, 413);
    equal("body quá lớn giữ hợp đồng success=false", (await oversized.json() as { success: boolean }).success, false);
    equal("server tiếp tục phục vụ sau request lỗi", (await fetch(base + "/health")).status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error?: Error) => error ? reject(error) : resolve()));
  }
  report("httpBoundary.test.ts");
})().catch((error) => { console.error(error); process.exitCode = 1; });
