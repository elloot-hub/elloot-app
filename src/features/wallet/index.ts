/**
 * Wallet feature — saldo, ledger e (futuro) saque PIX.
 *
 * STATUS: API client pronto (`api.ts`). UI em `/wallet`.
 * Payouts: model Prisma existe; routes de saque ainda não.
 */

export { fetchWallet } from "./api";
export type {
  WalletSummary,
  WalletLedgerEntry,
  WalletLedgerType,
  PendingReleaseBreakdown,
  PendingReleaseHold,
} from "./api";
