import { useEffect, useState } from "react";
import { aiApi } from "../api/aiApi";

/**
 * Hỏi backend một lần duy nhất xem tính năng AI có sẵn sàng không,
 * rồi dùng chung cho mọi màn hình. Nhờ vậy nút AI hiện ra ở trạng thái
 * mờ kèm giải thích, thay vì để người dùng bấm rồi mới nhận lỗi.
 */
let cached: boolean | null = null;
let pending: Promise<boolean> | null = null;

function fetchStatus(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!pending) {
    pending = aiApi
      .getStatus()
      .then((res) => {
        cached = res.data.data.configured;
        return cached;
      })
      .catch(() => {
        cached = false;
        return false;
      });
  }
  return pending;
}

export function useAiStatus(): { aiReady: boolean; checking: boolean } {
  const [aiReady, setAiReady] = useState(cached ?? false);
  const [checking, setChecking] = useState(cached === null);

  useEffect(() => {
    let ignore = false;
    fetchStatus().then((value) => {
      if (ignore) return;
      setAiReady(value);
      setChecking(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  return { aiReady, checking };
}
