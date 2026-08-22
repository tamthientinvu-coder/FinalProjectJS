import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { globalLimiter } from "./middleware/rateLimiter";
import routes from "./routes";
import prisma from "./utils/prisma";

const app: Application = express();

// 1) Bảo mật header (Bài 6)
app.use(helmet());

// 2) CORS - whitelist đúng origin của FE
const whitelist = ["http://localhost:5173", "http://localhost:3000", env.feUrl].filter(Boolean);
app.use(
  cors({
    origin: whitelist,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// 3) Body parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 4) Log + rate limit toàn cục
app.use(requestLogger);
app.use(globalLimiter);

// 5) Health check - Render/UptimeRobot ping vào đây
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, message: "LearnQuiz API - Nền tảng học tập & Quiz trực tuyến", version: "v1" });
});

// 6) Toàn bộ API dưới tiền tố /api/v1
app.use("/api/v1", routes);

// 7) 404 + error handler - LUÔN đặt cuối cùng
app.use(notFound);
app.use(errorHandler);

export default app;
