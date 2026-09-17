/**
 * Home feature — seções dinâmicas da homepage.
 *
 * STATUS: ativo
 *
 * Fontes (admin): CATEGORY | METRIC | MANUAL | PLACEMENT
 */

export { fetchHomeSections } from "./api";
export type {
  HomeSectionPayload,
  HomeSectionLayout,
  HomeSectionSource,
  HomeSectionsResponse,
} from "./api";
export { HomeSections } from "./components/home-sections";
export { HomeSectionBlock } from "./components/home-section-block";
