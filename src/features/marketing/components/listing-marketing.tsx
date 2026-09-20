"use client";

import { MarketingScripts } from "@/features/marketing/components/marketing-scripts";

type Props = {
  listingId: string;
  valueCents?: number;
  nonce?: string;
};

/** Client wrapper so listing pages can fire ViewContent with marketing tags. */
export function ListingMarketing({ listingId, valueCents, nonce }: Props) {
  return (
    <MarketingScripts
      listingId={listingId}
      includeScopes={["listing"]}
      event={{ name: "view_content", listingId, valueCents }}
      nonce={nonce}
    />
  );
}
