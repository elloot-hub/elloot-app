export function formatBRLFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/** Digits-as-cents mask → `1.234,56` (same UX as sell form). */
export function formatPriceMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 10);
  if (!digits) return "";
  const cents = Number(digits);
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPriceMaskFromCents(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) return "";
  return formatPriceMask(String(Math.round(cents)));
}

/**
 * Parses BRL mask (`1.234,56`), plain decimal (`12.34`), or comma decimal (`12,34`)
 * into integer cents.
 */
export function parseBrlToCents(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();

  if (trimmed.includes(",")) {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return undefined;
    const cents = Number(digits);
    return Number.isFinite(cents) ? cents : undefined;
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

/** Cents → stable query param (`12.34`). */
export function centsToQueryDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatDateTimePt(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
