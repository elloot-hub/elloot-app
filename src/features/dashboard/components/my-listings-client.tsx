"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyListings } from "@/features/listings/api";
import { listingVertical } from "@/features/catalog/listing-category";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ListingDetail } from "@/types/api";
import { ApiError } from "@/lib/api/errors";
import { ListingsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  SOLD: "Esgotado",
  REMOVED: "Removido",
};

export function MyListingsClient() {
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { listings: rows } = await fetchMyListings();
        if (!cancelled) setListings(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar seus anúncios.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <ListingsSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Você ainda não publicou anúncios.
        </p>
        <Link
          href={routes.sell}
          className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Criar primeiro anúncio
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
      {listings.map((listing) => {
        const cover = listing.media[0]?.url;
        const vertical = listingVertical(listing.category);
        return (
          <li key={listing.id}>
            <Link
              href={routes.listing(listing.id)}
              className="flex items-center gap-3 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{listing.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {vertical.name} · {STATUS_LABEL[listing.status] ?? listing.status}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-primary tabular-nums">
                  {formatBRLFromCents(listing.priceCents)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {listing.stockQuantity} est.
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
