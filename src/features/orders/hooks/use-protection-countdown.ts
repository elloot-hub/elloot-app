"use client";

import { useCountdown } from "@/features/orders/hooks/use-countdown";

/** Formata duração restante (ex.: 1d 4h, 15h 32m, 8m). */
export function formatRemainingDuration(ms: number): string {
  if (ms <= 0) return "agora";
  const totalMin = Math.max(1, Math.ceil(ms / 60_000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

export function useProtectionCountdown(releaseAt: string | null | undefined) {
  const { remainingMs, expired } = useCountdown(releaseAt);

  if (remainingMs == null || !releaseAt) {
    return {
      label: null as string | null,
      shortLabel: null as string | null,
      expired: false,
      remainingMs: null as number | null,
    };
  }

  const duration = formatRemainingDuration(remainingMs);
  return {
    label: expired
      ? "Liberação automática em andamento"
      : `Liberação automática em ${duration}`,
    shortLabel: expired ? "Liberando…" : duration,
    expired,
    remainingMs,
  };
}
