/**
 * Listings feature — detalhe e criação de anúncios.
 *
 * STATUS: ativo (wizard `/sell` estilo Trustmarket + cara Elloot)
 *
 * Fluxo: Produto → Ofertas → Imagens → Revisar
 * - `components/sell-page-content.tsx` — wizard
 * - `components/sell-stepper.tsx` — tabs de progresso
 * - `components/listing-detail.tsx` — página do anúncio
 * - `api.ts` — fetch/create (NORMAL / DYNAMIC / SERVICE)
 *
 * Alcance (taxas) e entrega Auto são UI preparada para algoritmo futuro;
 * Auto usa contagem de linhas como estoque por enquanto.
 */

export { createListing, fetchListing } from "./api";
export type { CreateListingInput, CreateListingOfferInput } from "./api";
