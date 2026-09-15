import type { OrderStatus } from "@/features/orders/types";

const LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendente de pagamento",
  PAID: "Aguardando entrega",
  DELIVERED: "Entregue",
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

/** Labels curtos para badges (chat, inbox, lista). */
export function orderStatusShortLabel(status: OrderStatus | string) {
  switch (status as OrderStatus) {
    case "PENDING_PAYMENT":
      return "Pendente";
    case "PAID":
      return "Aguardando";
    case "DELIVERED":
      return "Entregue";
    case "COMPLETED":
      return "Concluído";
    case "CANCELLED":
      return "Cancelado";
    case "EXPIRED":
      return "Expirado";
    case "DISPUTED":
      return "Disputa";
    case "REFUNDED":
      return "Reembolsado";
    default:
      return orderStatusLabel(status);
  }
}

export function orderStatusBadgeClass(status: OrderStatus | string) {
  switch (status as OrderStatus) {
    case "COMPLETED":
      return "border-emerald-500/10 bg-emerald-500/10 text-emerald-500 dark:text-emerald-500";
    case "PENDING_PAYMENT":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-500";
    case "PAID":
      return "border-primary/25 bg-primary/10 text-primary";
    case "DELIVERED":
      return "border-sky-500/25 bg-sky-500/10 text-sky-500 dark:text-sky-500";
    case "DISPUTED":
      return "border-orange-500/30 bg-orange-500/10 text-orange-500 dark:text-orange-500";
    case "CANCELLED":
    case "REFUNDED":
    case "EXPIRED":
      return "border-destructive/25 bg-destructive/10 text-destructive";
    default:
      return "border-border/70 bg-muted/50 text-muted-foreground";
  }
}
