import type { ConversationMessage } from "@/features/conversations/api";
import type { Order } from "@/features/orders/types";

export type ChatTimelineItem =
  | { kind: "date"; id: string; at: string }
  | { kind: "security"; id: string; at: string }
  | {
      kind: "auto-delivery";
      id: string;
      at: string;
      content: string;
      listingTitle: string;
    }
  | { kind: "message"; message: ConversationMessage }
  | {
      kind: "dispute-opened";
      id: string;
      at: string;
      openedByName: string;
      reason: string;
    }
  | {
      kind: "dispute-resolved";
      id: string;
      at: string;
      resolutionLabel: string;
      notes: string | null;
    };

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function formatChatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function resolveDeliveryMode(order: Order): "MANUAL" | "AUTO" | null {
  const offerMode = order.offer?.deliveryMode;
  if (offerMode === "AUTO" || offerMode === "MANUAL") return offerMode;
  const listingMode = order.listing.deliveryMode;
  if (listingMode === "AUTO" || listingMode === "MANUAL") return listingMode;
  return null;
}

function disputeResolutionLabel(
  resolution: Order["dispute"] extends infer D
    ? D extends { resolution: infer R }
      ? R
      : never
    : never,
): string {
  switch (resolution) {
    case "RELEASE_TO_SELLER":
      return "O pedido foi liberado para o vendedor.";
    case "REFUND_BUYER":
      return "O comprador recebeu reembolso integral.";
    case "PARTIAL":
      return "Foi aplicado um acordo parcial entre as partes.";
    default:
      return "A disputa foi encerrada.";
  }
}

export function buildChatTimeline(input: {
  messages: ConversationMessage[];
  order: Order | null;
  conversationCreatedAt: string;
  listingTitle: string;
}): ChatTimelineItem[] {
  const { messages, order, conversationCreatedAt, listingTitle } = input;
  const items: ChatTimelineItem[] = [];

  const startAt = order?.paidAt ?? conversationCreatedAt;
  items.push({ kind: "date", id: `date-${dayKey(startAt)}`, at: startAt });
  items.push({ kind: "security", id: "system-security", at: startAt });

  const deliveryMode = order ? resolveDeliveryMode(order) : null;
  const deliveryAt = order?.deliveredAt ?? order?.paidAt;
  const showAutoDelivery =
    Boolean(order) &&
    deliveryMode === "AUTO" &&
    Boolean(deliveryAt) &&
    order!.status !== "PENDING_PAYMENT" &&
    order!.status !== "CANCELLED" &&
    order!.status !== "EXPIRED";

  if (showAutoDelivery && deliveryAt) {
    const content =
      order?.deliveryContent?.trim() ||
      "Entrega automática processada. Se os dados não aparecerem aqui, confira o e-mail cadastrado ou entre em contato com o vendedor pelo chat.";
    items.push({
      kind: "auto-delivery",
      id: "system-auto-delivery",
      at: deliveryAt,
      content,
      listingTitle,
    });
  }

  let lastMessageDay: string | null = null;

  for (const [index, message] of messages.entries()) {
    const msgDay = dayKey(message.createdAt);
    if (index === 0 || lastMessageDay !== msgDay) {
      if (index === 0 || msgDay !== lastMessageDay) {
        items.push({
          kind: "date",
          id: `date-msg-${msgDay}-${index}`,
          at: message.createdAt,
        });
      }
      lastMessageDay = msgDay;
    }
    items.push({ kind: "message", message });
  }

  const dispute = order?.dispute;
  if (dispute) {
    const openedByName =
      dispute.openedById === order?.buyer.id
        ? order.buyer.name?.trim() || "Comprador"
        : dispute.openedById === order?.seller.id
          ? order.seller.name?.trim() || "Vendedor"
          : "Participante";

    items.push({
      kind: "dispute-opened",
      id: `dispute-opened-${dispute.id}`,
      at: dispute.createdAt,
      openedByName,
      reason: dispute.reason,
    });

    if (dispute.status === "RESOLVED" || dispute.status === "CANCELLED") {
      items.push({
        kind: "dispute-resolved",
        id: `dispute-resolved-${dispute.id}`,
        at: dispute.updatedAt,
        resolutionLabel: disputeResolutionLabel(dispute.resolution),
        notes: dispute.notes,
      });
    }
  }

  return items;
}
