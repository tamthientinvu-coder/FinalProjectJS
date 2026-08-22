import app from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import prisma from "./utils/prisma";

const server = app.listen(env.port, () => {
  logger.info(`LearnQuiz API đang chạy tại http://localhost:${env.port} [${env.nodeEnv}]`);
});

/** Graceful shutdown: đóng kết nối DB sạch sẽ khi Render restart container. */
async function shutdown(signal: string) {
  logger.info(`Nhận tín hiệu ${signal}, đang tắt server...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
