import { api } from "@/lib/api/client";

export type WalletLedgerType =
  | "CREDIT_SALE"
  | "DEBIT_PAYOUT"
  | "PLATFORM_FEE"
  | "REFUND"
  | "ADJUSTMENT";

export type WalletLedgerEntry = {
  id: string;
  type: WalletLedgerType | string;
  amountCents: number;
  balanceAfter: number;
  description: string | null;
  orderId: string | null;
  orderCode?: string | null;
  listingTitle?: string | null;
  createdAt: string;
};

export type PendingReleaseHold = {
  orderId: string;
  orderCode: string;
  listingTitle: string;
  netCents: number;
  releaseAt: string | null;
  status: string;
};

export type PendingReleaseBreakdown = {
  totalCents: number;
  releasesTodayCents: number;
  releasesUpcomingCents: number;
  inDisputeCents: number;
  holds: PendingReleaseHold[];
};

export type WalletSummary = {
  balanceCents: number;
  entries: WalletLedgerEntry[];
  pendingPayoutCents: number;
  pendingRelease: PendingReleaseBreakdown;
};

export async function fetchWallet() {
  return api.get<WalletSummary>("/api/wallet");
}
