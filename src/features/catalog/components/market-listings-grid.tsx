"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/features/catalog/components/listing-card";
import {
  fetchCatalogListings,
  type CatalogListingsQuery,
  type CatalogListingsSort,
} from "@/features/catalog/api";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type { ListingSummary } from "@/types/api";

type Props = {
  initialListings: ListingSummary[];
  initialCursor: string | null;
  query: {
    category: string;
    q?: string;
    sort?: CatalogListingsSort;
    minPriceCents?: number;
    maxPriceCents?: number;
  };
};

export function MarketListingsGrid({
  initialListings,
  initialCursor,
  query,
}: Props) {
  const [listings, setListings] = useState(initialListings);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setListings(initialListings);
    setCursor(initialCursor);
    setError(null);
  }, [
    initialListings,
    initialCursor,
    query.category,
    query.q,
    query.sort,
    query.minPriceCents,
    query.maxPriceCents,
  ]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params: CatalogListingsQuery = {
        category: query.category,
        q: query.q,
        sort: query.sort,
        minPriceCents: query.minPriceCents,
        maxPriceCents: query.maxPriceCents,
        cursor,
        limit: 24,
      };
      const data = await fetchCatalogListings(params);
      setListings((prev) => {
        const seen = new Set(prev.map((l) => l.id));
        return [...prev, ...data.listings.filter((l) => !seen.has(l.id))];
      });
      setCursor(data.nextCursor);
    } catch {
      setError("Não foi possível carregar mais anúncios.");
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, query]);

  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/30 px-6 py-16 text-center">
        <p className="text-sm font-medium">Nenhum anúncio nesta categoria</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ajuste os filtros ou escolha outra subcategoria.
        </p>
        <Link
          href={routes.sell}
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Criar anúncio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-5">
        {listings.map((listing, index) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            priority={index < 4}
          />
        ))}
      </div>

      {error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : null}

      {cursor ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {loading ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : listings.length >= 24 ? (
        <p className="text-center text-xs text-muted-foreground">
          Você viu todos os anúncios desta busca.
        </p>
      ) : null}
    </div>
  );
}
