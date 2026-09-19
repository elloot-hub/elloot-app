import Link from "next/link";
import { Suspense } from "react";
import { MarketBrowseToolbar, MarketCategorySidebar, MarketMobileFilters, type SubcategoryNavItem, } from "@/features/catalog/components/market-browse-ui";
import { MarketListingsGrid } from "@/features/catalog/components/market-listings-grid";
import { marketCategoryHref, type CategoryTreeMatch, } from "@/features/catalog/market-path";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { getCategoryIcon } from "@/features/catalog/phosphor-icons";
import type { CatalogListingsSort } from "@/features/catalog/api";
import { routes } from "@/lib/routes";
import { centsToQueryDecimal, formatBRLFromCents } from "@/lib/format";
import type { Category, ListingSummary } from "@/types/api";

type Props = {
  match: CategoryTreeMatch;
  listings: ListingSummary[];
  nextCursor: string | null;
  q?: string;
  sort?: CatalogListingsSort;
  minPriceCents?: number;
  maxPriceCents?: number;
  countsById?: Record<string, number>;
  totalCount?: number;
  allCount?: number;
};

function clearParamHref(
  pathname: string,
  current: URLSearchParams,
  keys: string[],
) {
  const next = new URLSearchParams(current);
  for (const key of keys) next.delete(key);
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function MarketBrowseView({
  match,
  listings,
  nextCursor,
  q,
  sort = "recent",
  minPriceCents,
  maxPriceCents,
  countsById,
  totalCount,
  allCount: allCountProp,
}: Props) {
  const { category, ancestors, children, siblings } = match;
  const isLeaf = children.length === 0;
  const sidebarCategories = isLeaf ? siblings : children;
  const browseRoot = isLeaf ? ancestors.at(-1) ?? null : category;
  const allHref = browseRoot ? marketCategoryHref(browseRoot) : routes.market;
  const activeId = isLeaf ? category.id : "__all__";

  const gameAncestor =
    ancestors.length >= 1
      ? isLeaf
        ? ancestors.at(-1)!
        : ancestors.at(-1) ?? null
      : null;
  const backParent =
    isLeaf && gameAncestor
      ? gameAncestor
      : ancestors.length > 0
        ? ancestors[0]!
        : null;
  const showBackToParent =
    backParent &&
    (!isLeaf ? ancestors.length > 0 : true) &&
    backParent.id !== category.id;

  const parentHref =
    showBackToParent && backParent ? marketCategoryHref(backParent) : null;
  const parentLabel = showBackToParent && backParent ? backParent.name : null;

  const navItems: SubcategoryNavItem[] = sidebarCategories.map((c) => ({
    id: c.id,
    name: c.name,
    href: marketCategoryHref(c),
    count: countsById?.[c.id],
  }));

  const allCount =
    typeof allCountProp === "number"
      ? allCountProp
      : typeof totalCount === "number"
        ? totalCount
        : undefined;

  const visual = getCategoryVisual(category.slug);
  const Icon = getCategoryIcon(category.icon) ?? visual.Icon;
  const cover = category.imageUrl || ancestors.at(-1)?.imageUrl || null;

  const crumbTrail: Category[] = [...ancestors, category];
  const categoryKey = category.slugPath || category.slug;
  const pathname = marketCategoryHref(category);

  const searchParams = new URLSearchParams();
  if (q) searchParams.set("q", q);
  if (sort && sort !== "recent") searchParams.set("sort", sort);
  if (minPriceCents != null) {
    searchParams.set("min", centsToQueryDecimal(minPriceCents));
  }
  if (maxPriceCents != null) {
    searchParams.set("max", centsToQueryDecimal(maxPriceCents));
  }

  const activeFilters: { label: string; clearHref: string }[] = [];
  if (q) {
    activeFilters.push({
      label: `Busca: ${q}`,
      clearHref: clearParamHref(pathname, searchParams, ["q"]),
    });
  }

  if (minPriceCents != null || maxPriceCents != null) {
    const minLabel =
      minPriceCents != null ? formatBRLFromCents(minPriceCents) : "…";
    const maxLabel =
      maxPriceCents != null ? formatBRLFromCents(maxPriceCents) : "…";
    activeFilters.push({
      label: `Preço: ${minLabel} – ${maxLabel}`,
      clearHref: clearParamHref(pathname, searchParams, ["min", "max"]),
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href={routes.home} className="hover:text-foreground">
          Início
        </Link>
        <span aria-hidden>/</span>
        <Link href={routes.market} className="hover:text-foreground">
          Categorias
        </Link>
        {crumbTrail.map((node, index) => {
          const last = index === crumbTrail.length - 1;
          return (
            <span key={node.id} className="inline-flex items-center gap-1.5">
              <span aria-hidden>/</span>
              {last ? (
                <span className="text-foreground">{node.name}</span>
              ) : (
                <Link
                  href={marketCategoryHref(node)}
                  className="hover:text-foreground"
                >
                  {node.name}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <header className="flex items-center gap-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border/60 sm:size-16">
          {cover ? (
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div
              className="flex size-full items-center justify-center"
              style={{ background: visual.gradient }}
            >
              <Icon className="size-7 text-white/90" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl text-muted-foreground font-semibold tracking-tight sm:text-3xl">
            Resultados para <span className="text-primary">{category.name}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {typeof totalCount === "number" ? totalCount : listings.length}{" "}
            {(typeof totalCount === "number" ? totalCount : listings.length) ===
            1
              ? "anúncio"
              : "anúncios"}
            {isLeaf ? ` em ${category.name}` : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <Suspense fallback={null}>
          <MarketCategorySidebar
            allCategoriesHref={routes.market}
            parentHref={parentHref}
            parentLabel={parentLabel}
            items={navItems}
            activeId={activeId}
            allHref={allHref}
            allCount={allCount}
            minPriceCents={minPriceCents}
            maxPriceCents={maxPriceCents}
          />
        </Suspense>

        <div className="min-w-0 space-y-5">
          <Suspense fallback={null}>
            <MarketMobileFilters
              items={navItems}
              activeId={activeId}
              allHref={allHref}
              allCount={allCount}
              minPriceCents={minPriceCents}
              maxPriceCents={maxPriceCents}
              parentHref={parentHref}
              parentLabel={parentLabel}
            />
          </Suspense>

          <Suspense fallback={null}>
            <MarketBrowseToolbar
              defaultQ={q}
              sort={sort}
              activeFilters={activeFilters}
            />
          </Suspense>

          <MarketListingsGrid
            initialListings={listings}
            initialCursor={nextCursor}
            query={{
              category: categoryKey,
              q,
              sort,
              minPriceCents,
              maxPriceCents,
            }}
          />
        </div>
      </div>
    </div>
  );
}

