import type { Role } from "@/types/api";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DISPUTED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export type OrderParty = {
  id: string;
  name: string | null;
  email: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  amountCents: number;
  feeCents: number;
  paidAt: string | null;
  deliveredAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    priceCents: number;
    media: Array<{ url: string }>;
  };
  buyer: OrderParty;
  seller: OrderParty;
  payment: {
    id: string;
    provider: string;
    providerRef: string;
    status: PaymentStatus | string;
    amountCents: number;
  } | null;
  escrowHold: {
    amountCents: number;
    releaseAt: string | null;
    releasedAt: string | null;
  } | null;
  conversation: { id: string } | null;
};

export type SandboxCheckout = {
  provider: "sandbox" | string;
  providerRef: string;
  amountCents: number;
  expiresAt: string;
  pixCopyPaste?: string | null;
  instructions?: string | null;
};

export type CreateOrderResponse = {
  order: Order;
  checkout: SandboxCheckout;
};

export type OrderRoleView = {
  isBuyer: boolean;
  isSeller: boolean;
  role: Role | null;
};
