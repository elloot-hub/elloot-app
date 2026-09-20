import { api } from "@/lib/api/client";

export type ResolvedMarketingTag = {
  key: string;
  scope: "platform" | "listing";
  config: Record<string, string>;
};

export async function resolveMarketingTags(opts?: {
  listingId?: string | null;
}) {
  return api.get<{ tags: ResolvedMarketingTag[] }>(
    "/api/platform/plugins/resolve",
    { query: { listingId: opts?.listingId ?? undefined } },
  );
}

export const MARKETING_CONSENT_KEY = "elloot_marketing_consent";
export const MARKETING_CONSENT_COOKIE = "elloot_mkt_consent";
/** Bump to force re-prompt after CMP policy changes. */
export const MARKETING_CONSENT_VERSION = "v2";

export type MarketingConsent = "granted" | "denied" | null;

function parseConsentValue(raw: string | null): MarketingConsent {
  if (!raw) return null;
  // Legacy unversioned
  if (raw === "granted" || raw === "denied") return null;
  const parts = raw.split(":");
  if (parts.length >= 2 && parts[0] === MARKETING_CONSENT_VERSION) {
    if (parts[1] === "granted" || parts[1] === "denied") return parts[1];
  }
  return null;
}

function readConsentCookie(): MarketingConsent {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${MARKETING_CONSENT_COOKIE}=`));
  if (!match) return null;
  return parseConsentValue(decodeURIComponent(match.split("=").slice(1).join("=")));
}

export function readMarketingConsent(): MarketingConsent {
  if (typeof window === "undefined") return null;
  try {
    const fromLs = parseConsentValue(
      window.localStorage.getItem(MARKETING_CONSENT_KEY),
    );
    if (fromLs) return fromLs;
  } catch {
    /* ignore */
  }
  return readConsentCookie();
}

function writeConsentCookie(choice: "granted" | "denied") {
  const value = encodeURIComponent(
    `${MARKETING_CONSENT_VERSION}:${choice}:${Date.now()}`,
  );
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${MARKETING_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function writeMarketingConsent(choice: "granted" | "denied") {
  const stored = `${MARKETING_CONSENT_VERSION}:${choice}:${Date.now()}`;
  try {
    window.localStorage.setItem(MARKETING_CONSENT_KEY, stored);
  } catch {
    /* ignore */
  }
  try {
    writeConsentCookie(choice);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("elloot:marketing-consent"));
  // Best-effort compliance log (ignore failures)
  void api
    .post("/api/platform/plugins/consent", {
      choice,
      version: MARKETING_CONSENT_VERSION,
    })
    .catch(() => undefined);
}
