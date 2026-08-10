"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyOrders } from "@/features/orders/api";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/features/orders/labels";
import type { Order, OrderStatus, PaymentStatus } from "@/features/orders/types";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { OrderListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

type Props = {
  /** When set, only show orders where the user is buyer or seller. */
  roleFilter?: "buyer" | "seller";
};

function shortOrderCode(id: string) {
  return id.replace(/-/g, "").slice(0, 7).toUpperCase();
}

function statusBadgeClass(status: OrderStatus | string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25";
    case "PENDING_PAYMENT":
    case "EXPIRED":
      return "bg-amber-500/15 text-amber-400 ring-amber-500/25";
    case "CANCELLED":
    case "REFUNDED":
      return "bg-destructive/15 text-destructive ring-destructive/25";
    case "DISPUTED":
      return "bg-orange-500/15 text-orange-400 ring-orange-500/25";
    default:
      return "bg-primary/15 text-primary ring-primary/25";
  }
}

function paymentLabel(status: PaymentStatus | string | undefined) {
  if (!status) return "Sem pagamento";
  switch (status) {
    case "PAID":
      return "Aprovado";
    case "PENDING":
      return "Pendente";
    case "FAILED":
      return "Falhou";
    case "EXPIRED":
      return "Expirado";
    case "REFUNDED":
      return "Reembolsado";
    default:
      return status;
  }
}

function formatOrderDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersListClient({ roleFilter }: Props) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { orders: next } = await fetchMyOrders();
        if (!cancelled) setOrders(next);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar os pedidos.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = orders.filter((order) => {
    if (!roleFilter || !user) return true;
    if (roleFilter === "buyer") return order.buyer.id === user.id;
    return order.seller.id === user.id;
  });

  if (loading) {
    return <OrderListSkeleton />;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 space-y-4 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {roleFilter === "buyer"
            ? "Você ainda não tem compras."
            : "Você ainda não tem pedidos."}
        </p>
        <Link href={routes.market} className={cn(buttonVariants())}>
          Explorar mercado
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {visible.map((order) => {
        const counterpart =
          user?.id === order.buyer.id ? order.seller : order.buyer;
        const counterpartLabel =
          user?.id === order.buyer.id ? "Vendedor" : "Comprador";
        const title = order.offer?.title ?? order.listing.title;
        const unitPrice = order.offer?.priceCents ?? order.listing.priceCents;

        return (
          <li key={order.id}>
            <article className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/35">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{shortOrderCode(order.id)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                        statusBadgeClass(order.status),
                      )}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>

                  <p className="truncate text-sm font-medium tracking-tight">
                    {title}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {formatBRLFromCents(unitPrice)}
                    </span>
                    <span className="text-border">·</span>
                    <span>
                      {order.payment?.provider ?? "Pix"}
                      {" · "}
                      <span
                        className={cn(
                          order.payment?.status === "PAID"
                            ? "text-emerald-400"
                            : orderStatusTone(order.status),
                        )}
                      >
                        {paymentLabel(order.payment?.status)}
                      </span>
                    </span>
                    <span className="text-border">·</span>
                    <span>
                      {counterpartLabel}:{" "}
                      <span className="text-foreground/80">
                        {counterpart.name?.trim() || counterpart.email}
                      </span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatOrderDate(order.createdAt)}</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      Total: {formatBRLFromCents(order.amountCents)}
                    </span>
                  </div>
                </div>

                <Link
                  href={routes.order(order.id)}
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "sm" }),
                    "shrink-0",
                  )}
                >
                  Ver pedido
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
