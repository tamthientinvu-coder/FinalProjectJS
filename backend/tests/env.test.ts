process.env.DATABASE_URL = "postgresql://x:x@localhost:5432/x";
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
delete process.env.GEMINI_MODEL;

import { equal, report, section } from "./helpers/assert";
import { env } from "../src/config/env";

section("Cấu hình Gemini mặc định");
equal("dùng model Gemini còn được hỗ trợ", env.gemini.model, "gemini-3.6-flash");
report("env.test.ts");
