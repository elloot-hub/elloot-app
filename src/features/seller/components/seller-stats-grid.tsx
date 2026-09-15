"use client";

import {
  ActivityIcon,
  ClockIcon,
  PackageCheckIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
} from "lucide-react";
import type { SellerProfileStats } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  stats: SellerProfileStats;
};

export function SellerStatsGrid({ stats }: Props) {
  const {
    totalSales,
    deliveredCount,
    deliveryRatePercent,
    avgDeliveryTime,
    positivePercent,
  } = stats;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ActivityIcon className="size-5 text-primary" />
            Métricas e Desempenho do Vendedor
          </h2>
          <p className="text-xs text-muted-foreground">
            Estatísticas reais de vendas, entregas e satisfação.
          </p>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex dark:text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-500" />
          Satisfação positiva: {positivePercent}%
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Card 1: Vendas Realizadas */}
        <StatCard
          icon={<ShoppingBagIcon className="size-5 text-sky-400" />}
          label="Vendas Realizadas"
          value={totalSales.toLocaleString("pt-BR")}
          subtext="Total de pedidos concluídos"
          badgeText="COMPROVADO"
          badgeColor="sky"
        />

        {/* Card 2: Produtos Entregues */}
        <StatCard
          icon={<PackageCheckIcon className="size-5 text-emerald-400" />}
          label="Produtos Entregues"
          value={deliveredCount.toLocaleString("pt-BR")}
          subtext="Entregas confirmadas com sucesso"
          badgeText="CONCLUÍDAS"
          badgeColor="emerald"
        />

        {/* Card 3: Média de Entregue */}
        <StatCard
          icon={<TrendingUpIcon className="size-5 text-violet-400" />}
          label="Média de Entregue"
          value={`${deliveryRatePercent}%`}
          subtext={`Tempo médio: ${avgDeliveryTime}`}
          badgeText="ALTA VELOCIDADE"
          badgeColor="violet"
        />
      </div>

      {/* Delivery Performance Bar */}
      <div className="rounded-md border border-border/60 bg-card/40 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-foreground">
            <ClockIcon className="size-3.5 text-primary" />
            Índice Global de Entregas com Sucesso
          </span>
          <span className="text-emerald-400 tabular-nums">
            {deliveryRatePercent}% Taxa de Sucesso ({deliveredCount} de {totalSales})
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${deliveryRatePercent}%` }}
          />
          <div
            className="h-full bg-rose-500/80 transition-all duration-500"
            style={{ width: `${100 - deliveryRatePercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  badgeText,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  badgeText: string;
  badgeColor: "sky" | "emerald" | "violet";
}) {
  const colorMap = {
    sky: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/35">
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-md bg-background/80 p-2.5 border border-border/40">
          {icon}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider",
            colorMap[badgeColor],
          )}
        >
          {badgeText}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground/80 leading-tight">
          {subtext}
        </p>
      </div>
    </div>
  );
}
