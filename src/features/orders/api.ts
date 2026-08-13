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

export async function fetchMyOrders() {
  return api.get<{ orders: Order[] }>("/api/orders/mine");
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

export async function deliverOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/deliver`);
}

export async function confirmOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/confirm`);
}

export async function cancelOrder(orderId: string) {
  return api.post<{ order: Order }>(`/api/orders/${orderId}/cancel`);
}
