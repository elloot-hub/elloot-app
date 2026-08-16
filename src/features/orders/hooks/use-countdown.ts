"use client";

import { useEffect, useState } from "react";

export function useCountdown(expiresAt: string | null | undefined) {
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    expiresAt ? Math.max(0, new Date(expiresAt).getTime() - Date.now()) : null,
  );

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null);
      return;
    }

    const tick = () => {
      setRemainingMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (remainingMs == null) {
    return { label: null as string | null, expired: false, remainingMs: null };
  }

  const expired = remainingMs <= 0;
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const label = expired
    ? "Expirado"
    : `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  return { label, expired, remainingMs };
}
