/**
 * Disputes feature — abrir e acompanhar disputas de pedido.
 *
 * STATUS: API + painel no order detail. Resolução admin via
 * `POST /api/disputes/:id/resolve`.
 */

export { fetchMyDisputes, openDispute } from "./api";
export type { Dispute, DisputeStatus, DisputeResolution } from "./api";
export {
  disputeStatusLabel,
  disputeResolutionLabel,
  disputeStatusTone,
} from "./labels";
export { OrderDisputePanel } from "./components/order-dispute-panel";
