/** Legacy helpers — tokens live in httpOnly cookie only (XSS-safe). */
const TOKEN_KEY = "elloot.accessToken";

/** Always null — kept for call-site compatibility during migration. */
export function getAccessToken(): string | null {
  return null;
}

/** No-op — session is the httpOnly cookie set by the API. */
export function setAccessToken(_token: string) {
  clearAccessToken();
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
