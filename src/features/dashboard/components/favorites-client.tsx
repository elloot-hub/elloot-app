"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { useFavorites } from "@/features/favorites";
import { fetchListing } from "@/features/listings/api";
import type { ListingSummary } from "@/types/api";
import { routes } from "@/lib/routes";
import { FavoritesSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

function toSummary(listing: Awaited<
  ReturnType<typeof fetchListing>
>["listing"]): ListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    priceCents: listing.priceCents,
    status: listing.status,
    listingModel: listing.listingModel,
    deliveryMode: listing.deliveryMode,
    productType: listing.productType,
    createdAt: listing.createdAt,
    category: listing.category,
    media: listing.media.map((m) => ({ url: m.url })),
    mediaCount: listing.media.length,
    seller: listing.seller,
  };
}

export function FavoritesClient() {
  const { ids, ready } = useFavorites();
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const idList = useMemo(() => [...ids], [ids]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (idList.length === 0) {
          if (!cancelled) setListings([]);
          return;
        }
        const results = await Promise.all(
          idList.map((id) =>
            fetchListing(id)
              .then((res) => toSummary(res.listing))
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        setListings(results.filter((l): l is ListingSummary => l != null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, idList]);

  if (!ready || loading) {
    return <FavoritesSkeleton />;
  }

  if (idList.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Você ainda não salvou anúncios.
        </p>
        <Link
          href={routes.market}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Explorar mercado
        </Link>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          {idList.length} favorito{idList.length === 1 ? "" : "s"} salvos — alguns
          podem estar indisponíveis no momento.
        </p>
        <Link
          href={routes.market}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ir ao mercado
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
