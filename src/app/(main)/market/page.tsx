import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { ListingFilters } from "@/features/catalog/components/listing-filters";
import { CategoryChips } from "@/features/catalog/components/category-chips";
import {
  fetchBrowseCategories,
  fetchCatalogListings,
} from "@/features/catalog/api";

export const metadata: Metadata = {
  title: "Mercado",
};

type Props = {
  searchParams: Promise<{
    category?: string;
    game?: string;
    q?: string;
  }>;
};

export default async function MarketPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeSlug = params.category ?? params.game;
  const [{ categories }, catalog] = await Promise.all([
    fetchBrowseCategories(),
    fetchCatalogListings({
      category: activeSlug,
      q: params.q,
      limit: 24,
    }),
  ]);

  const chipCategories = categories.filter(
    (c) => c.isFeatured || c.showInMenu,
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative overflow-hidden border-b border-border/50">
        <Container className="space-y-5 py-8 sm:py-10">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Mercado
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Jogos, serviços digitais e muito mais — com escrow.
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {catalog.listings.length}{" "}
              {catalog.listings.length === 1 ? "anúncio" : "anúncios"}
            </p>
          </div>
          <Suspense fallback={null}>
            <ListingFilters categories={categories} />
          </Suspense>
          <CategoryChips
            categories={
              chipCategories.length > 0
                ? chipCategories
                : categories.slice(0, 20)
            }
            activeSlug={activeSlug}
          />
        </Container>
      </div>

      <Container className="py-10 sm:py-12">
        {catalog.listings.length === 0 ? (
          <div className="surface-panel px-6 py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum anúncio encontrado. Tente outra categoria ou busca.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
            {catalog.listings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
