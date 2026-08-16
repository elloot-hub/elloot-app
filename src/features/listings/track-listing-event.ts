import { api } from "@/lib/api/client";

const VISITOR_KEY_STORAGE = "elloot_visitor_key";

function randomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export function getVisitorKey() {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY_STORAGE);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const next = randomKey().slice(0, 64);
    window.localStorage.setItem(VISITOR_KEY_STORAGE, next);
    return next;
  } catch {
    return randomKey().slice(0, 64);
  }
}

export async function trackListingEvent(
  listingId: string,
  type: "VIEW" | "PURCHASE_INTENT",
  amountCents?: number,
) {
  const visitorKey = getVisitorKey();
  if (!visitorKey) return;

  try {
    await api.post<{ recorded: boolean }>(`/api/listings/${listingId}/events`, {
      type,
      visitorKey,
      ...(typeof amountCents === "number" ? { amountCents } : {}),
    });
  } catch {
    // Analytics must never block UX.
  }
}
