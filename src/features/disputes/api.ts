import { api } from "@/lib/api/client";

export type DisputeStatus = "OPEN" | "RESOLVED" | "CANCELLED";
export type DisputeResolution =
  | "RELEASE_TO_SELLER"
  | "REFUND_BUYER"
  | "PARTIAL";

export type Dispute = {
  id: string;
  orderId: string;
  openedById: string;
  reason: string;
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    status: string;
    amountCents: number;
    feeCents: number;
    buyerId: string;
    sellerId: string;
    listing: { id: string; title: string };
  };
};

export async function fetchMyDisputes() {
  return api.get<{ disputes: Dispute[] }>("/api/disputes/mine");
}

export async function openDispute(orderId: string, reason: string) {
  return api.post<{ dispute: Dispute }>("/api/disputes", { orderId, reason });
}
