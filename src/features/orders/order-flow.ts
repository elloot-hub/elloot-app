import type { Order, OrderStatus } from "@/features/orders/types";

export type OrderFlowRole = "buyer" | "seller";

export type TimelineStepState = "done" | "current" | "future" | "cancelled";

export type OrderTimelineStep = {
  id: string;
  label: string;
  state: TimelineStepState;
};

const MAIN_STEPS = [
  { id: "payment", label: "Pagamento" },
  { id: "paid", label: "Pago" },
  { id: "delivered", label: "Entregue" },
  { id: "confirm", label: "Confirmar" },
  { id: "completed", label: "Concluído" },
] as const;

const TERMINAL_STATUSES = new Set<OrderStatus>([
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);

function resolveDeliveryMode(order: Order): "MANUAL" | "AUTO" | null {
  return order.offer?.deliveryMode ?? order.listing.deliveryMode ?? null;
}

function activeStepIndex(status: OrderStatus): number {
  switch (status) {
    case "PENDING_PAYMENT":
      return 0;
    case "PAID":
      return 1;
    case "DELIVERED":
      return 3;
    case "COMPLETED":
      return 4;
    case "EXPIRED":
      return 0;
    default:
      return -1;
  }
}

export function buildOrderTimelineSteps(
  status: OrderStatus,
): OrderTimelineStep[] {
  if (TERMINAL_STATUSES.has(status)) {
    const terminalLabel =
      status === "EXPIRED"
        ? "Expirado"
        : status === "REFUNDED"
          ? "Reembolsado"
          : "Cancelado";

    return [
      { id: "payment", label: "Pagamento", state: "done" },
      {
        id: "terminal",
        label: terminalLabel,
        state: "cancelled",
      },
    ];
  }

  if (status === "DISPUTED") {
    return [
      { id: "payment", label: "Pagamento", state: "done" },
      { id: "paid", label: "Pago", state: "done" },
      { id: "mediation", label: "Em mediação", state: "current" },
    ];
  }

  const current = activeStepIndex(status);
  if (current < 0) {
    return MAIN_STEPS.map((step) => ({
      ...step,
      state: "future" as const,
    }));
  }

  return MAIN_STEPS.map((step, index) => {
    if (index < current) {
      return { ...step, state: "done" as const };
    }
    if (index === current) {
      return { ...step, state: "current" as const };
    }
    return { ...step, state: "future" as const };
  });
}

export type OrderNextStep = {
  title: string;
  body: string;
  tone: "warning" | "info" | "success" | "danger";
};

export function getOrderNextStep(
  order: Order,
  role: OrderFlowRole,
): OrderNextStep | null {
  const { status, expiresAt } = order;
  const deliveryMode = resolveDeliveryMode(order);
  const isAuto = deliveryMode === "AUTO";

  if (status === "PENDING_PAYMENT" && role === "buyer") {
    const expiry = expiresAt
      ? formatExpiryHint(expiresAt)
      : "Finalize o pagamento para liberar a entrega.";
    return {
      title: "Próximo passo: pagar o PIX",
      body: expiry,
      tone: "warning",
    };
  }

  if (status === "PAID" && role === "seller") {
    return {
      title: "Próximo passo: entregar o pedido",
      body: "Envie o produto pelo chat e marque como entregue quando concluir.",
      tone: "info",
    };
  }

  if (status === "PAID" && role === "buyer") {
    return {
      title: "Aguardando entrega",
      body: "O pagamento está protegido. Se o vendedor atrasar ou houver problema, relate pelo chat.",
      tone: "info",
    };
  }

  if (status === "DELIVERED" && role === "buyer") {
    if (isAuto) {
      return {
        title: "Próximo passo: confirmar recebimento",
        body: "O conteúdo já foi enviado no chat. Confirme só se funcionar. Se a chave ou o acesso falhar, relate o problema — não confirme.",
        tone: "warning",
      };
    }
    return {
      title: "Próximo passo: confirmar recebimento",
      body: "Confirme se recebeu o produto. Se houver problema, relate pelo chat antes de confirmar.",
      tone: "warning",
    };
  }

  if (status === "DELIVERED" && role === "seller") {
    return {
      title: "Aguardando confirmação do comprador",
      body: "A entrega foi registrada. O valor será liberado após a confirmação ou no fim da proteção automática.",
      tone: "info",
    };
  }

  if (status === "DISPUTED") {
    return {
      title: "Mediação em andamento",
      body: "O valor permanece protegido. Acompanhe e envie evidências pelo chat.",
      tone: "danger",
    };
  }

  if (status === "COMPLETED" && role === "buyer" && !order.review) {
    return {
      title: "Pedido concluído",
      body: "Conte como foi sua experiência — sua avaliação ajuda outros compradores.",
      tone: "success",
    };
  }

  if (status === "COMPLETED") {
    return {
      title: "Pedido concluído",
      body: "Transação finalizada com sucesso.",
      tone: "success",
    };
  }

  if (status === "EXPIRED") {
    return {
      title: "Pagamento expirado",
      body: "O prazo do PIX encerrou. Crie um novo pedido se ainda quiser comprar.",
      tone: "danger",
    };
  }

  if (status === "CANCELLED" || status === "REFUNDED") {
    return {
      title: "Fluxo encerrado",
      body:
        status === "REFUNDED"
          ? "O valor foi reembolsado ao comprador."
          : "Este pedido não será concluído.",
      tone: "danger",
    };
  }

  return null;
}

export function getOrderListCta(order: Order, role: OrderFlowRole): string {
  if (order.status === "PENDING_PAYMENT" && role === "buyer") {
    return "Pagar PIX";
  }
  if (order.status === "PAID" && role === "seller") {
    return "Entregar";
  }
  if (order.status === "PAID" && role === "buyer") {
    return "Aguardando entrega";
  }
  if (order.status === "DELIVERED" && role === "buyer") {
    return "Confirmar recebimento";
  }
  if (order.status === "DISPUTED") {
    return "Ver mediação";
  }
  if (order.status === "COMPLETED" && role === "buyer" && !order.review) {
    return "Avaliar";
  }
  return "Abrir";
}

export function orderNeedsAttention(order: Order, role: OrderFlowRole): boolean {
  if (role === "buyer") {
    return ["PENDING_PAYMENT", "DELIVERED", "DISPUTED"].includes(order.status);
  }
  return ["PAID", "DISPUTED"].includes(order.status);
}

function formatExpiryHint(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "O prazo do PIX expirou.";
  const mins = Math.max(1, Math.round(ms / 60_000));
  if (mins <= 60) {
    return `O PIX expira em ${mins} min — pague para liberar a entrega.`;
  }
  const hours = Math.round(mins / 60);
  return `O PIX expira em cerca de ${hours}h — pague para liberar a entrega.`;
}

export function currentStepLabel(status: OrderStatus): string {
  const steps = buildOrderTimelineSteps(status);
  const current = steps.find((s) => s.state === "current");
  if (current) return current.label;
  const cancelled = steps.find((s) => s.state === "cancelled");
  if (cancelled) return cancelled.label;
  if (status === "COMPLETED") return "Concluído";
  return "Em andamento";
}
