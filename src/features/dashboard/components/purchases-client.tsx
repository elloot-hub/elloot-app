"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { useAuth } from "@/features/auth/context";
import { fetchMyOrders } from "@/features/orders/api";
import {
  DateRangePicker,
  toIsoDay,
} from "@/features/dashboard/components/date-range-picker";
import { useDashboardQueryState } from "@/features/dashboard/hooks/use-dashboard-query-state";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/features/orders/labels";
import type { Order, OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents, formatDateTimePt } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { OrderListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

const STATUS_FILTERS: Array<{ id: "all" | OrderStatus; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "PENDING_PAYMENT", label: "Aguardando PIX" },
  { id: "PAID", label: "Pagas" },
  { id: "DELIVERED", label: "Entregues" },
  { id: "COMPLETED", label: "Concluídas" },
  { id: "DISPUTED", label: "Disputas" },
  { id: "CANCELLED", label: "Canceladas" },
];

const STATUS_ITEMS = STATUS_FILTERS.map((item) => ({
  value: item.id,
  label: item.label,
}));

function parseStatus(value: string | null): "all" | OrderStatus {
  if (!value || value === "all") return "all";
  if (STATUS_FILTERS.some((item) => item.id === value)) {
    return value as OrderStatus;
  }
  return "all";
}

function PurchasesClientInner() {
  const { user } = useAuth();
  const { searchParams, replaceParams, period, setPeriod } =
    useDashboardQueryState();
  const status = parseStatus(searchParams.get("status"));
  const queryFromUrl = searchParams.get("q") ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(queryFromUrl);
  const [debouncedQuery, setDebouncedQuery] = useState(queryFromUrl);

  useEffect(() => {
    setQuery(queryFromUrl);
    setDebouncedQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = query.trim();
      setDebouncedQuery(next);
      if (next !== queryFromUrl) {
        replaceParams({ q: next || null });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, queryFromUrl, replaceParams]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { orders: rows } = await fetchMyOrders({
          role: "buyer",
          status: status === "all" ? undefined : status,
          q: debouncedQuery || undefined,
          take: 100,
          from: toIsoDay(period.from),
          to: toIsoDay(period.to),
        });
        if (!cancelled) setOrders(rows);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as compras.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, debouncedQuery, period]);

  const purchases = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.buyer.id === user.id);
  }, [orders, user]);

  const awaitingPayment = useMemo(
    () => purchases.filter((o) => o.status === "PENDING_PAYMENT"),
    [purchases],
  );

  const summary = useMemo(() => {
    const awaitingConfirm = purchases.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    const completed = purchases.filter((o) => o.status === "COMPLETED").length;
    const disputed = purchases.filter((o) => o.status === "DISPUTED").length;
    return {
      awaitingPayment: awaitingPayment.length,
      awaitingConfirm,
      completed,
      disputed,
    };
  }, [purchases, awaitingPayment.length]);

  if (loading && orders.length === 0) {
    return <OrderListSkeleton />;
  }

  if (error && orders.length === 0) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Aguardando PIX"
          value={String(summary.awaitingPayment)}
          hint="Finalize o pagamento"
        />
        <SummaryCard
          label="Aguardando confirmação"
          value={String(summary.awaitingConfirm)}
          hint="Entrega marcada pelo vendedor"
        />
        <SummaryCard
          label="Concluídas nesta lista"
          value={String(summary.completed)}
          hint={
            summary.disputed
              ? `${summary.disputed} em disputa`
              : "Sem disputas na lista"
          }
        />
        <SummaryCard
          label="Total filtrado"
          value={String(purchases.length)}
          hint="Pedidos no período"
        />
      </div>

      {status === "all" && awaitingPayment.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Aguardando pagamento</h2>
            <p className="text-sm text-muted-foreground">
              Pedidos com PIX pendente — pague para liberar a entrega.
            </p>
          </div>
          <OrderRows orders={awaitingPayment} highlight />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Histórico de compras</h2>
            <p className="text-sm text-muted-foreground">
              Filtre por período, status ou busque pelo título do anúncio.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Select
              value={status}
              items={STATUS_ITEMS}
              onValueChange={(value) => {
                const next = (value ?? "all") as "all" | OrderStatus;
                replaceParams({
                  status: next === "all" ? null : next,
                });
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker value={period} onChange={setPeriod} />
            <div className="relative w-full sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar anúncio…"
                className="h-9 rounded-md pl-9"
              />
            </div>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <OrderListSkeleton rows={4} />
        ) : purchases.length === 0 ? (
          <div className="rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Nenhuma compra encontrada com esses filtros.
            </p>
            <Link href={routes.market} className={cn(buttonVariants({ size: "sm" }))}>
              Explorar mercado
            </Link>
          </div>
        ) : (
          <OrderRows orders={purchases} />
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
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
      {orders.map((order) => {
        const cover = order.listing.media[0]?.url;
        return (
          <li
            key={order.id}
            className={cn(
              "flex items-center gap-3 px-3 py-3 sm:px-4",
              highlight ? "bg-amber-500/5" : "bg-card/30",
            )}
          >
            <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted sm:size-14">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {order.listing.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {order.offer?.title ? `${order.offer.title} · ` : ""}
                {order.seller.name ?? order.seller.email}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                <span className={orderStatusTone(order.status)}>
                  {orderStatusLabel(order.status)}
                </span>
                {" · "}
                {formatDateTimePt(order.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <p className="text-sm font-bold text-primary tabular-nums">
                {formatBRLFromCents(order.amountCents)}
              </p>
              <Link
                href={routes.order(order.id)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {order.status === "PENDING_PAYMENT"
                  ? "Pagar"
                  : order.status === "DELIVERED"
                    ? "Confirmar"
                    : "Abrir"}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function PurchasesClient() {
  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <PurchasesClientInner />
    </Suspense>
  );
}
