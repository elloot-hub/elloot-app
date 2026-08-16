/**
 * Disputes feature — abrir e acompanhar disputas de pedido.
 *
 * STATUS: API + modal no chat do pedido. Resolução admin via
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
export { ReportProblemDialog } from "./components/report-problem-dialog";
