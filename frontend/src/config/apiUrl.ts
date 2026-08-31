const LOCAL_API_URL = "http://localhost:3000/api/v1";

export function resolveApiUrl(
  raw: string | undefined,
  isProduction = false
): string {
  const configured = raw?.trim();

  if (!configured && isProduction) {
    throw new Error("[CONFIG] VITE_API_URL bắt buộc ở production");
  }

  const candidate = (configured || LOCAL_API_URL).replace(/\/+$/, "");
  let parsed: URL;

  try {
    if (candidate.includes("<") || candidate.includes(">")) {
      throw new Error("placeholder");
    }

    parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("protocol");
    }
  } catch {
    throw new Error(
      '[CONFIG] VITE_API_URL không hợp lệ: "' +
        candidate +
        '". Giá trị production phải có dạng https://ten-backend.example.com/api/v1'
    );
  }

  if (isProduction && parsed.protocol !== "https:") {
    throw new Error("[CONFIG] VITE_API_URL phải dùng HTTPS ở production");
  }

  if (parsed.pathname !== "/api/v1" || parsed.search || parsed.hash) {
    throw new Error(
      '[CONFIG] VITE_API_URL phải kết thúc bằng /api/v1 và không có query/hash: "' +
        candidate +
        '"'
    );
  }

  return candidate;
}

export const API_URL = resolveApiUrl(
  import.meta.env.VITE_API_URL,
  import.meta.env.PROD
);