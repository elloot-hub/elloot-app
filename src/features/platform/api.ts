import { api } from "@/lib/api/client";

export type PublicCommercialSettings = {
  minListingCents: number;
  paymentFeeCents: number;
};

const FALLBACK: PublicCommercialSettings = {
  minListingCents: 150,
  paymentFeeCents: 84,
};

let cache: { value: PublicCommercialSettings; expiresAt: number } | null =
  null;

export async function fetchPublicCommercial(): Promise<PublicCommercialSettings> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;

  try {
    const res = await api.get<{ commercial: PublicCommercialSettings }>(
      "/api/platform/commercial",
      { auth: false, revalidate: 30 },
    );
    const value = {
      minListingCents: res.commercial.minListingCents,
      paymentFeeCents: res.commercial.paymentFeeCents,
    };
    cache = { value, expiresAt: now + 30_000 };
    return value;
  } catch {
    return FALLBACK;
  }
}
