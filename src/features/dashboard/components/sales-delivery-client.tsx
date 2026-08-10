"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { fetchMyOrders } from "@/features/orders/api";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/features/orders/labels";
import type { Order } from "@/features/orders/types";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { OrderListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

export function SalesDeliveryClient() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { orders: rows } = await fetchMyOrders();
        if (!cancelled) setOrders(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as vendas.",
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

  const sales = useMemo(() => {
    if (!user) return [];
    return orders
      .filter((o) => o.seller.id === user.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, user]);

  const pendingDelivery = sales.filter((o) => o.status === "PAID");

  if (loading) {
    return <OrderListSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Aguardando entrega</h2>
          <p className="text-sm text-muted-foreground">
            Pedidos pagos — marque a entrega ou use o chat do pedido.
          </p>
        </div>
        {pendingDelivery.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma entrega pendente no momento.
          </p>
        ) : (
          <OrderRows orders={pendingDelivery} highlight />
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Todas as vendas</h2>
          <p className="text-sm text-muted-foreground">
            Histórico das vendas vinculadas à sua conta.
          </p>
        </div>
        {sales.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Você ainda não tem vendas.
          </p>
        ) : (
          <OrderRows orders={sales} />
        )}
      </section>
    </div>
  );
}

function OrderRows({
  orders,
  highlight,
}: {
  orders: Order[];
  highlight?: boolean;
}) {
  return (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
      {orders.map((order) => (
        <li
          key={order.id}
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4",
            highlight ? "bg-amber-500/5" : "bg-card/30",
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {order.listing.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Comprador: {order.buyer.name ?? order.buyer.email} ·{" "}
              <span className={orderStatusTone(order.status)}>
                {orderStatusLabel(order.status)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-primary tabular-nums">
              {formatBRLFromCents(order.amountCents)}
            </p>
            <Link
              href={routes.order(order.id)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {order.status === "PAID" ? "Entregar" : "Abrir"}
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
