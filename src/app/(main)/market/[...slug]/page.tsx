import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { MarketBrowseView } from "@/features/catalog/components/market-browse-view";
import { fetchCatalogListings, fetchCategories, fetchCategoryStats, type CatalogListingsSort, } from "@/features/catalog/api";
import { findCategoryInTree } from "@/features/catalog/market-path";
import { parseBrlToCents } from "@/lib/format";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    min?: string;
    max?: string;
  }>;
};

function parseSort(value?: string): CatalogListingsSort {
  if (
    value === "recent" ||
    value === "price_asc" ||
    value === "price_desc" ||
    value === "reputation" ||
    value === "best_sellers"
  ) {
    return value;
  }
  return "best_sellers";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = slug.join("/");
  const { categories } = await fetchCategories();
  const match = findCategoryInTree(categories, path);
  if (!match) {
    return { title: "Categoria" };
  }
  const name = match.category.name;
  return {
    title: match.category.titleSeo || `${name} — Mercado`,
    description:
      match.category.descriptionSeo ||
      match.category.subtitleSeo ||
      `Comprar e vender ${name} com pagamento protegido no Elloot.`,
    ...(match.category.isNoindex ? { robots: { index: false } } : {}),
  };
}

export default async function MarketCategoryPage({
  params,
  searchParams,
}: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const path = slug.join("/");
  const q = query.q?.trim();
  const sort = parseSort(query.sort);
  const minPriceCents = parseBrlToCents(query.min);
  const maxPriceCents = parseBrlToCents(query.max);

  const { categories } = await fetchCategories();
  const match = findCategoryInTree(categories, path);
  if (!match) notFound();

  const categoryKey = match.category.slugPath || match.category.slug;
  const isLeaf = (match.children?.length ?? 0) === 0;
  const statsParentKey = isLeaf
    ? match.ancestors.at(-1)?.slugPath ||
    match.ancestors.at(-1)?.slug ||
    categoryKey
    : categoryKey;

  const [catalog, stats] = await Promise.all([
    fetchCatalogListings({
      category: categoryKey,
      q,
      sort,
      minPriceCents,
      maxPriceCents,
      limit: 24,
    }),
    fetchCategoryStats(statsParentKey),
  ]);

  const countsById = Object.fromEntries(
    stats.children.map((child) => [child.id, child.count]),
  );

  return (
    <div className="flex flex-1 flex-col">
      <Container className="py-8 sm:py-10">
        <MarketBrowseView
          match={match}
          listings={catalog.listings}
          nextCursor={catalog.nextCursor}
          q={q}
          sort={sort}
          minPriceCents={minPriceCents}
          maxPriceCents={maxPriceCents}
          countsById={countsById}
          totalCount={
            isLeaf
              ? (countsById[match.category.id] ?? catalog.listings.length)
              : stats.total
          }
          allCount={stats.total}
        />
      </Container>
    </div>
  );
}
