/**
 * Catalog feature — browse categories & listings.
 *
 * STATUS: ativo
 *
 * Fluxo do mercado:
 * - `/market` — diretório visual de categorias (seções + filtro)
 * - `/market/[...slug]` — página da categoria (sidebar + anúncios)
 * - `/market?q=` — busca global
 * - `?category=` legado redireciona para a URL por slugPath
 *
 * Onde mexer:
 * - `components/market-category-directory.tsx` — diretório
 * - `components/market-browse-view.tsx` — página do jogo/folha
 * - `market-path.ts` — hrefs e resolução na árvore
 * - `components/header-search.tsx` + `categories-modal.tsx`
 * - `home-categories.ts` — slugs do grid da home
 * - `api.ts` — fetch público
 */

export {
  fetchBrowseCategories,
  fetchCatalogListings,
  fetchCategories,
  fetchCategoriesFlat,
  fetchCategoryStats,
  fetchListingCategories,
  fetchProductTypes,
} from "./api";
export type {
  CatalogListingsSort,
  CategoryStats,
  ProductTypeOption,
} from "./api";
export { CategoryGrid } from "./components/category-grid";
export { CategoryChips } from "./components/category-chips";
export { CategoryCarousel } from "./components/category-carousel";
export { ListingCard } from "./components/listing-card";
export { MarketCategoryDirectory } from "./components/market-category-directory";
export { MarketBrowseView } from "./components/market-browse-view";
export { getCategoryVisual } from "./category-visuals";
export {
  marketCategoryHref,
  findCategoryInTree,
  groupCategoriesByParent,
} from "./market-path";
export {
  HOME_POPULAR_CATEGORY_SLUGS,
  pickHomeGridCategories,
} from "./home-categories";
