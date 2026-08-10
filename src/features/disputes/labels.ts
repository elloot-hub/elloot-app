export type DisputeStatus = "OPEN" | "RESOLVED" | "CANCELLED" | string;
export type DisputeResolution =
  | "RELEASE_TO_SELLER"
  | "REFUND_BUYER"
  | "PARTIAL"
  | string;

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Aberta",
  RESOLVED: "Resolvida",
  CANCELLED: "Cancelada",
};

const RESOLUTION_LABELS: Record<string, string> = {
  RELEASE_TO_SELLER: "Liberado ao vendedor",
  REFUND_BUYER: "Reembolsado ao comprador",
  PARTIAL: "Acordo parcial",
};

export function disputeStatusLabel(status: DisputeStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function disputeResolutionLabel(resolution: DisputeResolution | null) {
  if (!resolution) return null;
  return RESOLUTION_LABELS[resolution] ?? resolution;
}

export function disputeStatusTone(status: DisputeStatus) {
  switch (status) {
    case "OPEN":
      return "text-orange-600 dark:text-orange-400";
    case "RESOLVED":
      return "text-emerald-600 dark:text-emerald-400";
    case "CANCELLED":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}
