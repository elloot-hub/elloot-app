import { api } from "@/lib/api/client";
import type { CatalogListingsResponse, Category } from "@/types/api";

export type CatalogListingsQuery = {
  category?: string;
  /** @deprecated use category */
  game?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
};

const emptyCategories = {
  success: true as const,
  categories: [] as Category[],
};

const emptyListings: CatalogListingsResponse = {
  listings: [],
  nextCursor: null,
};

async function safeCatalog<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[catalog]", err);
    return fallback;
  }
}

export async function fetchCategories(query?: {
  featured?: boolean;
  menu?: boolean;
}) {
  return safeCatalog(
    () =>
      api.get<{ success: boolean; categories: Category[] }>(
        "/api/catalog/categories",
        {
          auth: false,
          query: {
            featured: query?.featured ? "1" : undefined,
            menu: query?.menu ? "1" : undefined,
          },
        },
      ),
    emptyCategories,
  );
}

export async function fetchCategoriesFlat(query?: {
  parent?: string;
  featured?: boolean;
  menu?: boolean;
}) {
  return safeCatalog(
    () =>
      api.get<{ success: boolean; categories: Category[] }>(
        "/api/catalog/categories/flat",
        {
          auth: false,
          query: {
            parent: query?.parent,
            featured: query?.featured ? "1" : undefined,
            menu: query?.menu ? "1" : undefined,
          },
        },
      ),
    emptyCategories,
  );
}

/** Mid-level categories for chips/carousel (games + other verticals). */
export async function fetchBrowseCategories() {
  return fetchCategoriesFlat();
}

export async function fetchCatalogListings(query: CatalogListingsQuery = {}) {
  return safeCatalog(
    () =>
      api.get<CatalogListingsResponse>("/api/catalog/listings", {
        auth: false,
        query: {
          category: query.category ?? query.game,
          q: query.q,
          limit: query.limit,
          cursor: query.cursor,
          minPriceCents: query.minPriceCents,
          maxPriceCents: query.maxPriceCents,
        },
      }),
    emptyListings,
  );
}
