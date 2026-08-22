import pino from "pino";
import { env } from "../config/env";

/**
 * Structured logging (Bài 11 - Observability).
 * - Dev: in màu, dễ đọc.
 * - Prod: JSON, log aggregator (Better Stack/Datadog) parse được.
 * - redact: TỰ ĐỘNG che field nhạy cảm, không phụ thuộc việc dev có nhớ hay không.
 */
export const logger = pino({
  level: env.isProd ? "info" : "debug",
  transport: env.isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
  redact: {
    paths: [
      "req.headers.authorization",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "body.password",
    ],
    censor: "[REDACTED]",
  },
});
