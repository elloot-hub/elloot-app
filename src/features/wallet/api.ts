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
  createdAt: string;
};

export type WalletSummary = {
  balanceCents: number;
  entries: WalletLedgerEntry[];
};

export async function fetchWallet() {
  return api.get<WalletSummary>("/api/wallet");
}
