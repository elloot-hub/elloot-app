"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { fetchMyListings } from "@/features/listings/api";
import { fetchMyOrders } from "@/features/orders/api";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { MetricsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

export function MetricsClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    activeListings: 0,
    salesTotal: 0,
    salesCompleted: 0,
    salesPending: 0,
    revenueCents: 0,
    disputes: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [listingsRes, ordersRes] = await Promise.all([
          fetchMyListings().catch(() => ({ listings: [] })),
          fetchMyOrders().catch(() => ({ orders: [] })),
        ]);
        if (cancelled || !user) return;
        const listings = listingsRes.listings ?? [];
        const sales = (ordersRes.orders ?? []).filter(
          (o) => o.seller.id === user.id,
        );
        setData({
          activeListings: listings.filter((l) => l.status === "ACTIVE").length,
          salesTotal: sales.length,
          salesCompleted: sales.filter((o) => o.status === "COMPLETED").length,
          salesPending: sales.filter(
            (o) => o.status === "PAID" || o.status === "DELIVERED",
          ).length,
          revenueCents: sales
            .filter((o) => o.status === "COMPLETED")
            .reduce((sum, o) => sum + (o.amountCents - o.feeCents), 0),
          disputes: sales.filter((o) => o.status === "DISPUTED").length,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = [
    { label: "Anúncios ativos", value: String(data.activeListings) },
    { label: "Vendas (365d*)", value: String(data.salesTotal) },
    { label: "Concluídas", value: String(data.salesCompleted) },
    { label: "Em andamento", value: String(data.salesPending) },
    {
      label: "Receita liberada",
      value: formatBRLFromCents(data.revenueCents),
    },
    { label: "Disputas", value: String(data.disputes) },
  ];

  if (loading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Visão rápida do desempenho como vendedor. Gráficos e reputação avançada
        entram depois — os números já usam seus pedidos reais.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-md border border-border/60 bg-card/40 p-4"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{card.value}</p>
            </div>
          ))}
        </div>
      <p className="text-[11px] text-muted-foreground">
        *Por enquanto considera todo o histórico disponível na API, não só 365
        dias.{" "}
        <Link href={routes.dashboardSales} className="text-primary hover:underline">
          Ver vendas
        </Link>
      </p>
    </div>
  );
}
