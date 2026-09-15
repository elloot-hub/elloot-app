import { api } from "@/lib/api/client";

export type PayoutStatus = "REQUESTED" | "PAID" | "FAILED" | "CANCELLED";

export type Payout = {
  id: string;
  code?: string;
  amountCents: number;
  pixKey: string;
  status: PayoutStatus;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMyPayouts() {
  return api.get<{ payouts: Payout[] }>("/api/payouts/mine");
}

export async function createPayout(input: {
  amountCents: number;
  pixKey?: string;
  totpCode?: string;
}) {
  return api.post<{ payout: Payout }>("/api/payouts", input);
}
