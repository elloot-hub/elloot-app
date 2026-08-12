import { routes } from "@/lib/routes";

/**
 * Aceita só paths internos relativos (ex.: /orders). Evita open redirect.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = routes.market,
): string {
  if (!value) return fallback;
  // Reject backslashes (/\evil.com) and encoded tricks before other checks.
  if (/[\\]/.test(value) || /%5c/i.test(value)) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) {
    return fallback;
  }
  // Only allow simple relative paths (no protocol-ish segments).
  if (value.includes("://")) return fallback;
  return value;
}
