"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PackageSearchIcon, SearchIcon } from "lucide-react";

import { useAuth } from "@/features/auth/context";
import { fetchMyOrders } from "@/features/orders/api";
import { DateRangePicker, toIsoDay, } from "@/features/dashboard/components/date-range-picker";
import { useDashboardQueryState } from "@/features/dashboard/hooks/use-dashboard-query-state";
import type { Order, OrderStatus } from "@/features/orders/types";
import { ApiError } from "@/lib/api/errors";
import { OrderList } from "@/features/orders/components/order-list-row";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { OrderListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

const STATUS_FILTERS: Array<{ id: "all" | OrderStatus; label: string }> = [
  { id: "all", label: "Todos os status" },
  { id: "PENDING_PAYMENT", label: "Aguardando pagamento" },
  { id: "PAID", label: "Pagas" },
  { id: "DELIVERED", label: "Entregues" },
  { id: "COMPLETED", label: "Concluídas" },
  { id: "DISPUTED", label: "Disputas" },
  { id: "CANCELLED", label: "Canceladas" },
  { id: "EXPIRED", label: "Expiradas" },
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

  const summary = useMemo(() => {
    const awaitingPayment = purchases.filter(
      (o) => o.status === "PENDING_PAYMENT",
    ).length;
    const awaitingConfirm = purchases.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    const openChat = purchases.filter((o) =>
      ["PAID", "DELIVERED", "DISPUTED"].includes(o.status),
    ).length;
    return {
      awaitingPayment,
      awaitingConfirm,
      openChat,
      total: purchases.length,
    };
  }, [purchases]);

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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <SummaryStat
          label="PIX pendente"
          value={summary.awaitingPayment}
          hint="Pagar agora"
        />
        <SummaryStat
          label="Confirmar"
          value={summary.awaitingConfirm}
          hint="Entrega recebida?"
        />
        <SummaryStat
          label="Em andamento"
          value={summary.openChat}
          hint="Pago / entrega / disputa"
        />
        <SummaryStat
          label="Nesta lista"
          value={summary.total}
          hint="Com os filtros atuais"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:min-w-[14rem]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Código do pedido ou anúncio…"
            className="h-9 rounded-md border-border/70 bg-background/70 pl-9"
          />
        </div>
        <div className="flex flex-row items-center gap-2">
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
            <SelectTrigger className="w-full sm:w-48">
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

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <OrderListSkeleton rows={4} />
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border/70 bg-card/20 px-4 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <PackageSearchIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum pedido encontrado</p>
            <p className="text-xs text-muted-foreground text-pretty">
              Ajuste os filtros ou explore o mercado para fazer uma nova compra.
            </p>
          </div>
          <Link href={routes.market} className={cn(buttonVariants({ size: "sm" }))}>
            Explorar mercado
          </Link>
        </div>
      ) : (
        <OrderList
          orders={purchases}
          role="buyer"
          getCounterpartyLabel={(o) => o.seller.name ?? o.seller.email}
        />
      )}
    </div>
  );
}

function SummaryStat({ label, value, hint, }: { label: string; value: number; hint: string; }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-3 py-3 sm:px-4">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function PurchasesClient() {
  return (
    <Suspense fallback={<OrderListSkeleton />}>
      <PurchasesClientInner />
    </Suspense>
  );
};