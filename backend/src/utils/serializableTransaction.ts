import prisma from "./prisma";

const MAX_RETRIES = 3;

function isWriteConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null &&
    (error as { code?: string }).code === "P2034";
}

/** Chạy read-check-write nguyên tử và thử lại khi PostgreSQL phát hiện xung đột. */
export async function serializableTransaction<T>(
  work: (tx: any) => Promise<T>
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!isWriteConflict(error) || attempt === MAX_RETRIES) throw error;
    }
  }
  throw new Error("Không thể hoàn tất transaction");
}
