import { api } from "@/lib/api/client";
import type {
  CatalogListingsResponse,
  Category,
  ListingProductType,
} from "@/types/api";

export type CatalogListingsSort =
  | "recent"
  | "best_sellers"
  | "price_asc"
  | "price_desc"
  | "reputation";

export type CatalogListingsQuery = {
  category?: string;
  /** @deprecated use category */
  game?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: CatalogListingsSort;
};

export type ProductTypeOption = {
  value: ListingProductType | string;
  label: string;
};

const emptyCategories = {
  success: true as const,
  categories: [] as Category[],
};

const emptyListings: CatalogListingsResponse = {
  listings: [],
  nextCursor: null,
};

const emptyProductTypes = {
  success: true as const,
  productTypes: [] as ProductTypeOption[],
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

/**
 * Mid-level listing taxonomy for /sell:
 * 1) Categoria (Jogos, Redes Sociais, IA…)
 * 2) Categoria principal (Free Fire, Instagram…)
 * 3) Subcategoria (Contas, Diamantes…) quando houver
 */
export async function fetchListingCategories(_query?: { children?: boolean }) {
  return safeCatalog(
    () =>
      api.get<{ success: boolean; categories: Category[] }>(
        "/api/catalog/categories/listing",
        { auth: false },
      ),
    emptyCategories,
  );
}

export async function fetchProductTypes() {
  return safeCatalog(
    () =>
      api.get<{ success: boolean; productTypes: ProductTypeOption[] }>(
        "/api/catalog/product-types",
        { auth: false },
      ),
    emptyProductTypes,
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
          sort: query.sort,
        },
      }),
    emptyListings,
  );
}

export type CategoryChildStat = {
  id: string;
  slug: string;
  slugPath: string;
  name: string;
  count: number;
};

export type CategoryStats = {
  total: number;
  children: CategoryChildStat[];
};

const emptyStats: CategoryStats = { total: 0, children: [] };

export async function fetchCategoryStats(category: string) {
  return safeCatalog(
    () =>
      api.get<CategoryStats>("/api/catalog/category-stats", {
        auth: false,
        query: { category },
      }),
    emptyStats,
  );
}
