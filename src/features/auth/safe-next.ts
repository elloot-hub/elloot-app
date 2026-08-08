import { routes } from "@/lib/routes";

/**
 * Aceita só paths internos relativos (ex.: /orders). Evita open redirect.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = routes.market,
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) {
    return fallback;
  }
  return value;
}
