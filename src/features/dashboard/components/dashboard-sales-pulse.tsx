"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  presetToRange,
  toIsoDay,
  type PeriodPreset,
} from "@/features/dashboard/components/date-range-picker";
import {
  fetchSellerMetrics,
  type SellerMetrics,
} from "@/features/orders/api";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type RangeId = Exclude<PeriodPreset, "custom">;

const RANGES: { id: RangeId; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

type Props = {
  className?: string;
};

export function DashboardSalesPulse({ className }: Props) {
  const [range, setRange] = useState<RangeId>("today");
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const period = presetToRange(range);
    void fetchSellerMetrics({
      from: toIsoDay(period.from),
      to: toIsoDay(period.to),
    })
      .then((res) => {
        if (!cancelled) setMetrics(res.metrics);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const kpis = metrics?.kpis;

  return (
    <section
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-4 select-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Pulso de vendas</h3>
          <p className="text-xs text-muted-foreground">
            Receita líquida no período selecionado
          </p>
        </div>
        <Link
          href={routes.dashboardMetrics}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver métricas
        </Link>
      </div>

      <div
        className="mt-3 flex gap-1 rounded-md bg-muted/40 p-0.5"
        role="tablist"
        aria-label="Período das vendas"
      >
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={range === item.id}
            onClick={() => setRange(item.id)}
            className={cn(
              "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              range === item.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 grid-cols-3">
        <PulseStat
          label="Receita líquida"
          value={loading ? "…" : formatBRLFromCents(kpis?.netCents ?? 0)}
          emphasize
        />
        <PulseStat
          label="Vendas"
          value={loading ? "…" : String(kpis?.salesCount ?? 0)}
        />
        <PulseStat
          label="Ticket médio"
          value={loading ? "…" : formatBRLFromCents(kpis?.avgTicketCents ?? 0)}
        />
      </div>
    </section>
  );
}

function PulseStat({ label, value, emphasize, }: { label: string; value: string; emphasize?: boolean; }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums sm:text-xl",
          emphasize && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
};