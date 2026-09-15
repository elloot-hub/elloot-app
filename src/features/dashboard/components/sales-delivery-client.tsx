"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";

import { useAuth } from "@/features/auth/context";
import { fetchMyOrders } from "@/features/orders/api";
import {
  DateRangePicker,
  toIsoDay,
} from "@/features/dashboard/components/date-range-picker";
import { useDashboardQueryState } from "@/features/dashboard/hooks/use-dashboard-query-state";
import { OrderList } from "@/features/orders/components/order-list-row";
import type { Order, OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/lib/api/errors";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

const STATUS_FILTERS: Array<{ id: "all" | OrderStatus; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "PAID", label: "Entregar" },
  { id: "DELIVERED", label: "Entregues" },
  { id: "COMPLETED", label: "Concluídas" },
  { id: "PENDING_PAYMENT", label: "Aguardando PIX" },
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

function SalesDeliveryClientInner() {
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
          role: "seller",
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
  }, [status, debouncedQuery, period]);

  const sales = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.seller.id === user.id);
  }, [orders, user]);

  const pendingDelivery = useMemo(
    () => sales.filter((o) => o.status === "PAID"),
    [sales],
  );

  const summary = useMemo(() => {
    const inProgress = sales.filter(
      (o) => o.status === "PAID" || o.status === "DELIVERED",
    ).length;
    const completed = sales.filter((o) => o.status === "COMPLETED").length;
    const disputed = sales.filter((o) => o.status === "DISPUTED").length;
    return { inProgress, completed, disputed, pending: pendingDelivery.length };
  }, [sales, pendingDelivery.length]);

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
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Aguardando entrega"
          value={String(summary.pending)}
          hint="Pedidos pagos"
        />
        <SummaryCard
          label="Em andamento"
          value={String(summary.inProgress)}
          hint="Pago ou entregue"
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
      </div>

      {status === "all" && pendingDelivery.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">Aguardando entrega</h2>
            <p className="text-sm text-muted-foreground">
              Pedidos pagos — entregue pelo chat ou marque a entrega.
            </p>
          </div>
          <OrderList
            orders={pendingDelivery}
            role="seller"
            getCounterpartyLabel={(o) => o.buyer.name ?? o.buyer.email}
            highlight
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Histórico de vendas</h2>
            <p className="text-sm text-muted-foreground">
              Filtre por período, status ou busque pelo título do anúncio.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative order-first w-full sm:order-none sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar anúncio…"
                className="h-9 rounded-md pl-9"
              />
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
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
        ) : sales.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Nenhuma venda encontrada com esses filtros.
          </p>
        ) : (
          <OrderList
            orders={sales}
            role="seller"
            getCounterpartyLabel={(o) => o.buyer.name ?? o.buyer.email}
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, hint, }: { label: string; value: string; hint: string; }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SalesDeliveryClient() {
  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <SalesDeliveryClientInner />
    </Suspense>
  );
}
