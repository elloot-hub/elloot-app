/**
 * Orders feature — comprar, pagar (sandbox), entregar, confirmar.
 *
 * STATUS: ativo (fluxo escrow end-to-end no frontend)
 *
 * Onde mexer:
 * - `api.ts` / `types.ts` / `labels.ts`
 * - `components/buy-escrow-button.tsx`
 * - `components/order-detail-client.tsx` — pay / deliver / confirm
 * - `components/orders-list-client.tsx`
 *
 * Chat e disputa: features separadas (`conversations`, `disputes`).
 */

export {
  OrderTimeline,
} from "./components/order-timeline";
export {
  OrderNextStepCallout,
} from "./components/order-next-step-callout";
export { OrderList, OrderListRow } from "./components/order-list-row";
export {
  buildOrderTimelineSteps,
  getOrderNextStep,
  getOrderListCta,
  orderNeedsAttention,
  currentStepLabel,
} from "./order-flow";
export type { OrderFlowRole, OrderNextStep } from "./order-flow";
