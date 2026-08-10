/**
 * Listings feature — detalhe e criação de anúncios.
 *
 * STATUS: ativo (wizard `/sell` estilo Trustmarket + cara Elloot)
 *
 * Fluxo: Produto → Ofertas → Imagens → Revisar
 * - `components/sell-page-content.tsx` — wizard
 * - `components/sell-stepper.tsx` — tabs de progresso
 * - `components/listing-detail.tsx` — página do anúncio
 * - `components/listing-buy-panel.tsx` — compra + seleção de oferta
 * - `api.ts` — fetch/create (NORMAL / DYNAMIC / SERVICE)
 *
 * Alcance e entrega Auto estão na UI; Auto usa contagem de linhas como estoque
 * até existir inventário de chaves no backend.
 */

export { createListing, fetchListing, fetchMyListings } from "./api";
export type { CreateListingInput, CreateListingOfferInput } from "./api";
