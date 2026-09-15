"use client";

import Link from "next/link";
import { MessageSquareIcon } from "lucide-react";
import {
  getOrderListCta,
  getOrderNextStep,
  orderNeedsAttention,
  type OrderFlowRole,
} from "@/features/orders/order-flow";
import {
  orderStatusBadgeClass,
  orderStatusShortLabel,
} from "@/features/orders/labels";
import type { Order } from "@/features/orders/types";
import { formatBRLFromCents, formatDateTimePt } from "@/lib/format";
import { formatOrderCode, orderRouteRef } from "@/lib/order-code";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  order: Order;
  role: OrderFlowRole;
  counterpartyLabel: string;
  highlight?: boolean;
};

export function OrderListRow({
  order,
  role,
  counterpartyLabel,
  highlight,
}: Props) {
  const needsAttention = orderNeedsAttention(order, role);
  const nextStep = getOrderNextStep(order, role);
  const cta = getOrderListCta(order, role);
  const hasChat = Boolean(order.conversation);
  const partyPrefix = role === "buyer" ? "Vendedor" : "Comprador";
  const offerLabel = order.offer?.title?.trim();

  return (
    <li
      className={cn(
        "rounded-md border px-3.5 py-3.5 transition-colors sm:px-4",
        highlight || needsAttention
          ? "border-primary/25 bg-primary/[0.04]"
          : "border-border/60 bg-card/40",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-muted-foreground tabular-nums">
              Pedido #{formatOrderCode(order)}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-md border-none px-2 py-0.5 text-[11px] font-medium",
                orderStatusBadgeClass(order.status),
              )}
            >
              {orderStatusShortLabel(order.status)}
            </span>
          </div>

          <p className="text-sm leading-snug text-pretty">
            <span className="font-medium text-muted-foreground">1×</span>{" "}
            <span className="font-semibold text-foreground">
              {order.listing.title}
            </span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-semibold text-primary tabular-nums">
              {formatBRLFromCents(order.amountCents)}
            </span>
          </p>

          <p className="text-xs text-muted-foreground">
            <span className="tabular-nums">
              {formatDateTimePt(order.createdAt)}
            </span>
            <span aria-hidden> · </span>
            <span>
              {partyPrefix}: {counterpartyLabel}
            </span>
            {offerLabel ? (
              <>
                <span aria-hidden> · </span>
                <span>{offerLabel}</span>
              </>
            ) : null}
          </p>

          {needsAttention && nextStep ? (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {nextStep.title}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Link
            href={routes.order(orderRouteRef(order))}
            className={cn(
              buttonVariants({
                variant: hasChat ? "outline" : "default",
                size: "sm",
              }),
            )}
          >
            {cta === "Abrir" ? "Ver pedido" : cta}
          </Link>
          {hasChat ? (
            <Link
              href={routes.conversation(orderRouteRef(order))}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <MessageSquareIcon className="size-3.5" />
              Chat
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

type OrderListProps = {
  orders: Order[];
  role: OrderFlowRole;
  getCounterpartyLabel: (order: Order) => string;
  highlight?: boolean;
};

export function OrderList({
  orders,
  role,
  getCounterpartyLabel,
  highlight,
}: OrderListProps) {
  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <OrderListRow
          key={order.id}
          order={order}
          role={role}
          counterpartyLabel={getCounterpartyLabel(order)}
          highlight={highlight}
        />
      ))}
    </ul>
  );
}
