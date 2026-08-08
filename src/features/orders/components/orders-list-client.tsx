"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyOrders } from "@/features/orders/api";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/features/orders/labels";
import type { Order } from "@/features/orders/types";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function OrdersListClient() {
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando pedidos…</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="surface-panel space-y-4 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Você ainda não tem pedidos.
        </p>
        <Link href={routes.market} className={cn(buttonVariants(), "rounded-full")}>
          Explorar mercado
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => {
        const roleLabel =
          user?.id === order.buyer.id
            ? "Compra"
            : user?.id === order.seller.id
              ? "Venda"
              : "Pedido";
        return (
          <li key={order.id}>
            <Link
              href={routes.order(order.id)}
              className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/50 p-4 transition-colors hover:border-primary/40 hover:bg-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium tracking-tight">
                  {order.listing.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {roleLabel} ·{" "}
                  <span className={orderStatusTone(order.status)}>
                    {orderStatusLabel(order.status)}
                  </span>
                </p>
              </div>
              <p className="font-heading text-base font-semibold tabular-nums">
                {formatBRLFromCents(order.amountCents)}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
