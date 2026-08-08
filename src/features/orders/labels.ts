import type { OrderStatus } from "@/features/orders/types";

const LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago — aguardando entrega",
  DELIVERED: "Entregue — confirme",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
  DISPUTED: "Em disputa",
  REFUNDED: "Reembolsado",
};

export function orderStatusLabel(status: OrderStatus | string) {
  return LABELS[status as OrderStatus] ?? status;
}

export function orderStatusTone(status: OrderStatus | string) {
  switch (status) {
    case "COMPLETED":
      return "text-emerald-600 dark:text-emerald-400";
    case "PENDING_PAYMENT":
    case "EXPIRED":
      return "text-amber-600 dark:text-amber-400";
    case "CANCELLED":
    case "REFUNDED":
      return "text-destructive";
    case "DISPUTED":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-primary";
  }
}
