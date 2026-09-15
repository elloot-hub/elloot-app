import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { MarketCategoryDirectory } from "@/features/catalog/components/market-category-directory";
import { fetchBrowseCategories, fetchCatalogListings, fetchCategories, } from "@/features/catalog/api";
import { findCategoryInTree, marketCategoryHref, } from "@/features/catalog/market-path";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Categorias",
  description:
    "Explore jogos e verticais do Elloot. Escolha uma categoria para comprar e vender com escrow.",
};

type Props = {
  searchParams: Promise<{
    category?: string;
    game?: string;
    q?: string;
    sort?: string;
  }>;
};

export default async function MarketPage({ searchParams }: Props) {
  const params = await searchParams;
  const legacySlug = params.category ?? params.game;
  const q = params.q?.trim();

  if (legacySlug && !q) {
    const { categories: tree } = await fetchCategories();
    const match = findCategoryInTree(tree, legacySlug);
    if (match) {
      permanentRedirect(marketCategoryHref(match.category));
    }
  }

  if (q) {
    const sort = params.sort === "price_asc" || params.sort === "price_desc" || params.sort === "reputation" || params.sort === "best_sellers" || params.sort === "recent" ? params.sort : "best_sellers";
    const catalog = await fetchCatalogListings({ category: legacySlug, q, sort, limit: 48, });

    return (
      <div className="flex flex-1 flex-col">
        <Container className="space-y-6 py-8 sm:py-10">
          <div className="space-y-2">
            <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Link href={routes.home} className="hover:text-foreground">
                Início
              </Link>
              <span aria-hidden>/</span>
              <Link href={routes.market} className="hover:text-foreground">
                Categorias
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">Busca</span>
            </nav>
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Resultados para “{q}”
            </h1>
            <p className="text-sm text-muted-foreground">
              {catalog.listings.length}{" "}
              {catalog.listings.length === 1 ? "anúncio" : "anúncios"}
            </p>
          </div>

          {catalog.listings.length === 0 ? (
            <div className="rounded-md border border-border/60 bg-card/30 px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum anúncio encontrado. Tente outra busca ou{" "}
                <Link
                  href={routes.market}
                  className="font-medium text-primary hover:underline"
                >
                  explorar categorias
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
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

  const { categories } = await fetchBrowseCategories();

  return (
    <div className="flex flex-1 flex-col">
      <Container className="py-8 sm:py-12">
        <MarketCategoryDirectory categories={categories} />
      </Container>
    </div>
  );
}