import { routes } from "@/lib/routes";

const AUTH_NEXT_STORAGE_KEY = "elloot.auth.next";

/**
 * Aceita só paths internos relativos (ex.: /orders). Evita open redirect.
 * Default: home (`/`), não o mercado.
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback: string = routes.home,
): string {
  if (!value) return fallback;
  if (/[\\]/.test(value) || /%5c/i.test(value)) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (
    value.startsWith("/login") ||
    value.startsWith("/register") ||
    value.startsWith("/forgot-password") ||
    value.startsWith("/reset-password") ||
    value.startsWith("/auth/")
  ) {
    return fallback;
  }
  return value;
}

/** Lê `next` da query atual (client). */
export function readNextFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("next");
}

export function loginHref(next?: string | null): string {
  const dest = safeNextPath(next, routes.home);
  if (dest === routes.home) return routes.login;
  return `${routes.login}?next=${encodeURIComponent(dest)}`;
}

export function registerHref(next?: string | null): string {
  const dest = safeNextPath(next, routes.home);
  if (dest === routes.home) return routes.register;
  return `${routes.register}?next=${encodeURIComponent(dest)}`;
}

/** Guarda destino para OAuth (API não repassa `next` no state). */
export function stashAuthNext(next?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const dest = safeNextPath(next ?? readNextFromLocation(), routes.home);
    if (dest === routes.home) {
      sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    } else {
      sessionStorage.setItem(AUTH_NEXT_STORAGE_KEY, dest);
    }
  } catch {
    /* private mode */
  }
}

export function consumeStashedAuthNext(fallback: string = routes.home): string {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = sessionStorage.getItem(AUTH_NEXT_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_NEXT_STORAGE_KEY);
    return safeNextPath(raw, fallback);
  } catch {
    return fallback;
  }
}

/** Navegação completa — middleware enxerga o cookie de sessão. */
export function hardRedirect(path: string) {
  if (typeof window === "undefined") return;
  window.location.assign(safeNextPath(path, routes.home));
}
