/**
 * Catalog feature — browse categories & listings.
 *
 * STATUS: ativo
 *
 * Onde mexer:
 * - `components/header-search.tsx` + `categories-modal.tsx` — busca do header + modal
 * - `home-categories.ts` — quais categorias entram no grid da home (edite os slugs)
 * - `api.ts` — fetch de categorias / listings (API pública)
 * - `components/` — grid, chips, carousel, card, filtros
 * - `category-visuals.ts` — fallback visual quando não há imageUrl
 * - `listing-category.ts` — resolve vertical (parent) de um listing
 *
 * Páginas que usam: `/` (home), `/market`, cards em orders/detail.
 * Rota canônica do mercado: `/market` (não `/marketplace`).
 */

export { fetchBrowseCategories, fetchCatalogListings, fetchCategories, fetchCategoriesFlat } from "./api";
export { CategoryGrid } from "./components/category-grid";
export { CategoryChips } from "./components/category-chips";
export { CategoryCarousel } from "./components/category-carousel";
export { ListingCard } from "./components/listing-card";
export { getCategoryVisual } from "./category-visuals";
export {
  HOME_POPULAR_CATEGORY_SLUGS,
  pickHomeGridCategories,
} from "./home-categories";
