import { api } from "@/lib/api/client";
import type {
  CreateOrderResponse,
  Order,
  OrderCheckout,
} from "@/features/orders/types";

export async function createOrder(listingId: string, offerId?: string) {
  return api.post<CreateOrderResponse>("/api/orders", {
    listingId,
    ...(offerId ? { offerId } : {}),
  });
}

export async function fetchMyOrders(params?: {
  role?: "buyer" | "seller" | "all";
  status?: string;
  q?: string;
  take?: number;
  from?: string;
  to?: string;
}) {
  const search = new URLSearchParams();
  if (params?.role) search.set("role", params.role);
  if (params?.status) search.set("status", params.status);
  if (params?.q) search.set("q", params.q);
  if (params?.take) search.set("take", String(params.take));
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const query = search.toString();
  return api.get<{ orders: Order[] }>(
    `/api/orders/mine${query ? `?${query}` : ""}`,
  );
}

export type SellerMetricRange = "7d" | "30d" | "90d" | "365d" | "custom";

export type SellerMetricsKpis = {
  salesCount: number;
  completedCount: number;
  pendingCount: number;
  disputedCount: number;
  cancelledCount: number;
  cancelledCents: number;
  grossCents: number;
  netCents: number;
  feesCents: number;
  avgTicketCents: number;
  conversionPercent: number;
  activeListings: number;
  uniqueBuyers: number;
  uniqueVisits: number;
  purchaseIntents: number;
  purchaseIntentCents: number;
  listingConversionPercent: number;
};

export type SellerMetricsListing = {
  listingId: string;
  title: string;
  sales: number;
  completed: number;
  buyers: number;
  revenueCents: number;
  feesCents: number;
  netCents: number;
  sharePercent: number;
  profitabilityPercent: number;
  uniqueVisits: number;
  purchaseIntents: number;
  conversionPercent: number;
};

export type SellerMetrics = {
  range: SellerMetricRange;
  granularity?: "day" | "hour";
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  kpis: SellerMetricsKpis;
  previousKpis: SellerMetricsKpis;
  comparison: {
    salesCount: number;
    grossCents: number;
    netCents: number;
    completedCount: number;
    cancelledCount: number;
    disputedCount: number;
    uniqueBuyers: number;
    avgTicketCents: number;
    uniqueVisits: number;
    purchaseIntents: number;
    listingConversionPercent: number;
  };
  series: Array<{
    date: string;
    sales: number;
    completed: number;
    grossCents: number;
    netCents: number;
  }>;
  byStatus: Array<{ status: string; count: number; amountCents: number }>;
  listings: SellerMetricsListing[];
  topListings: SellerMetricsListing[];
  buyers: {
    total: number;
    frequent: number;
    new: number;
    repurchaseRatePercent: number;
  };
  heatmap: {
    cells: Array<{
      weekday: number;
      weekdayLabel: string;
      hour: number;
      sales: number;
    }>;
    max: number;
    totalSales: number;
    avgDailySales: number;
    peakWeekdayLabel: string;
    peakHourLabel: string;
  };
  funnel: {
    uniqueVisits: number;
    purchaseIntents: number;
    uniquePurchaseIntents: number;
    purchaseIntentCents: number;
    salesCount: number;
    grossCents: number;
    visitToIntentPercent: number;
    intentToSalePercent: number;
    visitToSalePercent: number;
  };
  costs: {
    grossCents: number;
    feesCents: number;
    netCents: number;
    feeSharePercent: number;
  };
};

export async function fetchSellerMetrics(params: {
  range?: Exclude<SellerMetricRange, "custom">;
  from?: string;
  to?: string;
} = {}) {
  const search = new URLSearchParams();
  if (params.range) search.set("range", params.range);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  const query = search.toString();
  return api.get<{ metrics: SellerMetrics }>(
    `/api/orders/seller/metrics${query ? `?${query}` : ""}`,
  );
}

export async function fetchOrder(id: string) {
  return api.get<{ order: Order }>(`/api/orders/${id}`);
}

export async function startCheckout(orderId: string) {
  return api.post<{ checkout: OrderCheckout }>(
    `/api/orders/${orderId}/checkout`,
  );
}

export async function syncEfiPayment(providerRef: string) {
  return api.post<{
    ok: boolean;
    paid?: boolean;
    status?: string;
    alreadyPaid?: boolean;
    orderId?: string;
    releaseAt?: string;
  }>("/api/payments/efi/sync", { providerRef });
}

export async function confirmSandboxPayment(providerRef: string) {
  return api.post<{
    ok: boolean;
    alreadyPaid?: boolean;
    orderId: string;
    releaseAt?: string;
  }>("/api/payments/sandbox/confirm", { providerRef });
}

export type PaymentMethod = {
  id: "pix" | "card";
  label: string;
  hint: string;
  available: boolean;
  provider?: "sandbox" | "efi" | null;
};

export async function fetchPaymentMethods() {
  return api.get<{
    provider: string;
    methods: PaymentMethod[];
  }>("/api/payments/methods");
}

export async function deliverOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/deliver`);
}

export async function confirmOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/confirm`);
}

export async function cancelOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/cancel`);
}
