"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart, XAxis, YAxis, } from "recharts";

import { ChevronDownIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig, } from "@/components/ui/chart";
import { fetchSellerMetrics, type SellerMetrics, } from "@/features/orders/api";
import {
  DateRangePicker,
  toIsoDay,
} from "@/features/dashboard/components/date-range-picker";
import { useDashboardQueryState } from "@/features/dashboard/hooks/use-dashboard-query-state";
import { orderStatusLabel } from "@/features/orders/labels";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { MetricsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Visão geral" },
  { id: "listings", label: "Anúncios" },
  { id: "costs", label: "Custos" },
  { id: "service", label: "Atendimento" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseMetricsTab(value: string | null): TabId {
  if (value === "listings" || value === "costs" || value === "service") {
    return value;
  }
  return "overview";
}

function csvEscape(value: string | number) {
  const raw = String(value);
  if (/[",\n;]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function downloadMetricsCsv(metrics: SellerMetrics) {
  const rows: Array<Array<string | number>> = [
    ["Métrica", "Valor"],
    ["Vendas brutas (centavos)", metrics.kpis.grossCents],
    ["Você recebeu (centavos)", metrics.kpis.netCents],
    ["Vendas", metrics.kpis.salesCount],
    ["Visitas únicas", metrics.kpis.uniqueVisits],
    ["Intenções de compra", metrics.kpis.purchaseIntents],
    ["Conversão de anúncio (%)", metrics.kpis.listingConversionPercent],
    [],
    [
      "Anúncio",
      "Vendas",
      "Visitas",
      "Conversão (%)",
      "Receita (centavos)",
      "Líquido (centavos)",
    ],
    ...metrics.listings.map((row) => [
      row.title,
      row.sales,
      row.uniqueVisits,
      row.conversionPercent,
      row.revenueCents,
      row.netCents,
    ]),
  ];
  const body = rows
    .map((line) => line.map((cell) => csvEscape(cell ?? "")).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `elloot-metricas-${toIsoDay(new Date(metrics.from))}_${toIsoDay(new Date(metrics.to))}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const revenueConfig = {
  gross: { label: "Vendas brutas", color: "var(--chart-2)" },
  net: { label: "Você recebeu", color: "var(--chart-1)" },
} satisfies ChartConfig;

const buyersConfig = {
  frequent: { label: "Frequentes", color: "var(--chart-1)" },
  new: { label: "Novos", color: "var(--chart-2)" },
} satisfies ChartConfig;

const costsConfig = {
  received: { label: "Você recebeu", color: "var(--chart-1)" },
} satisfies ChartConfig;

const conversionConfig = {
  rate: { label: "Conclusão", color: "var(--chart-2)" },
} satisfies ChartConfig;

function formatDayLabel(date: string) {
  if (date.includes("T")) {
    const hour = date.slice(11, 13);
    return `${hour}h`;
  }
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};

function compactBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
};

function formatDelta(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
};

function Delta({ value, featured }: { value: number; featured?: boolean }) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        featured
          ? "text-primary-foreground/80"
          : positive
            ? "text-emerald-600 dark:text-emerald-400"
            : negative
              ? "text-rose-600 dark:text-rose-400"
              : "text-muted-foreground",
        featured && positive && "text-emerald-200",
        featured && negative && "text-rose-200",
      )}
    >
      {formatDelta(value)}
    </span>
  );
};

function MetricCard({ label, value, hint, delta, featured, }: { label: string; value: string; hint?: string; delta?: number; featured?: boolean; }) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 select-none",
        featured
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-card/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            featured ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {typeof delta === "number" ? (
          <Delta value={delta} featured={featured} />
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs",
            featured ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};

function heatmapTone(sales: number, max: number) {
  if (sales <= 0 || max <= 0) return "bg-muted/50";
  const ratio = sales / max;
  if (ratio < 0.34) return "bg-primary/25";
  if (ratio < 0.67) return "bg-primary/55";
  return "bg-primary";
};

export function MetricsClient() {
  const searchParams = useSearchParams();
  const tab = parseMetricsTab(searchParams.get("tab"));
  const { period, setPeriod } = useDashboardQueryState();

  const [kpisExpanded, setKpisExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SellerMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = toIsoDay(period.from);
    const to = toIsoDay(period.to);
    void fetchSellerMetrics({ from, to })
      .then(({ metrics: next }) => {
        if (!cancelled) setMetrics(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as métricas.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const isHourly = metrics?.granularity === "hour";

  const chartData = useMemo(
    () =>
      (metrics?.series ?? []).map((point) => ({
        date: point.date,
        label: formatDayLabel(point.date),
        gross: point.grossCents / 100,
        net: point.netCents / 100,
      })),
    [metrics],
  );

  const buyersRadial = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        name: "frequent",
        value: metrics.buyers.frequent,
        fill: "var(--color-frequent)",
      },
      {
        name: "new",
        value: metrics.buyers.new,
        fill: "var(--color-new)",
      },
    ].filter((row) => row.value > 0);
  }, [metrics]);

  const costsRadial = useMemo(() => {
    if (!metrics) return [];
    const received =
      metrics.costs.grossCents > 0
        ? Math.min(
          100,
          Math.round(
            (metrics.costs.netCents / metrics.costs.grossCents) * 100,
          ),
        )
        : 0;
    return [{ name: "received", value: received, fill: "var(--color-received)" }];
  }, [metrics]);

  const conversionRadial = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        name: "rate",
        value: metrics.kpis.conversionPercent,
        fill: "var(--color-rate)",
      },
    ];
  }, [metrics]);

  const hasChartData = chartData.some((p) => p.gross > 0 || p.net > 0);
  const statusTotal = metrics?.byStatus.reduce((sum, row) => sum + row.count, 0) ?? 0;

  if (loading && !metrics) {
    return <MetricsSkeleton />;
  }

  if (error && !metrics) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (!metrics) return null;

  const { kpis, comparison, buyers, heatmap, costs, listings, funnel } = metrics;
  const compareLabel = (() => {
    const from = new Date(metrics.previousFrom).toLocaleDateString("pt-BR");
    const to = new Date(metrics.previousTo).toLocaleDateString("pt-BR");
    return `Comparado ao período anterior: ${from} a ${to}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-muted-foreground">
          Desempenho das vendas com funil de visitas → intenção → conversão.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!metrics}
            onClick={() => {
              if (!metrics) return;
              downloadMetricsCsv(metrics);
            }}
          >
            <DownloadIcon className="size-4" />
            Exportar CSV
          </Button>
          <DateRangePicker value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/60">
        {TABS.map((item) => {
          const hrefParams = new URLSearchParams(searchParams.toString());
          hrefParams.set("tab", item.id);
          return (
            <Link
              key={item.id}
              href={`${routes.dashboardMetrics}?${hrefParams.toString()}`}
              scroll={false}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                tab === item.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">{compareLabel}</p>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
              <MetricCard
                featured
                label="Vendas brutas"
                value={formatBRLFromCents(kpis.grossCents)}
                hint={`${kpis.salesCount} vendas`}
                delta={comparison.grossCents}
              />
              <MetricCard
                featured
                label="Você recebeu"
                value={formatBRLFromCents(kpis.netCents)}
                hint={`${kpis.completedCount} concluídas`}
                delta={comparison.netCents}
              />
              <MetricCard
                featured
                label="Preço médio por venda"
                value={formatBRLFromCents(kpis.avgTicketCents)}
                hint={`${formatBRLFromCents(kpis.feesCents)} em taxas`}
                delta={comparison.avgTicketCents}
              />
              <MetricCard
                featured
                label="Taxa de conclusão"
                value={`${kpis.conversionPercent}%`}
                hint="Concluídas ÷ (vendas + canceladas)"
              />
            </div>

            {kpisExpanded ? (
              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Intenção de compra"
                  value={String(kpis.purchaseIntents)}
                  hint={formatBRLFromCents(kpis.purchaseIntentCents)}
                  delta={comparison.purchaseIntents}
                />
                <MetricCard
                  label="Quantidade de vendas"
                  value={String(kpis.salesCount)}
                  hint={`${kpis.uniqueBuyers} compradores`}
                  delta={comparison.salesCount}
                />
                <MetricCard
                  label="Conversão de anúncio"
                  value={`${kpis.listingConversionPercent}%`}
                  hint="Vendas ÷ visitas únicas"
                  delta={comparison.listingConversionPercent}
                />
                <MetricCard
                  label="Visitas únicas"
                  value={String(kpis.uniqueVisits)}
                  hint="Páginas do anúncio no período"
                  delta={comparison.uniqueVisits}
                />
                <MetricCard
                  label="Vendas canceladas"
                  value={String(kpis.cancelledCount)}
                  hint={formatBRLFromCents(kpis.cancelledCents)}
                  delta={comparison.cancelledCount}
                />
                <MetricCard
                  label="Disputas"
                  value={String(kpis.disputedCount)}
                  hint={`${kpis.pendingCount} em andamento`}
                  delta={comparison.disputedCount}
                />
                <MetricCard
                  label="Anúncios ativos"
                  value={String(kpis.activeListings)}
                  hint="Visíveis no marketplace"
                />
              </div>
            ) : null}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setKpisExpanded((open) => !open)}
              >
                {kpisExpanded ? "Ver menos" : "Ver mais métricas"}
                <ChevronDownIcon
                  className={cn(
                    "size-4 transition-transform",
                    kpisExpanded && "rotate-180",
                  )}
                />
              </Button>
            </div>
          </div>

          <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">
                  Conversão de visitas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Funil do anúncio: visita → intenção (carrinho/comprar) → venda
                  paga.
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                Conversão total {funnel.visitToSalePercent}%
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-border/50 p-4">
                <p className="text-xs text-muted-foreground">Visitas únicas</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {funnel.uniqueVisits}
                </p>
              </div>
              <div className="rounded-md border border-border/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Intenção de compra
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {funnel.visitToIntentPercent}%
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {funnel.purchaseIntents}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBRLFromCents(funnel.purchaseIntentCents)}
                </p>
              </div>
              <div className="rounded-md border border-border/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Vendas brutas</p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {funnel.intentToSalePercent}%
                  </span>
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {funnel.salesCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatBRLFromCents(funnel.grossCents)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Vendas no período</h2>
              <p className="text-sm text-muted-foreground">
                {isHourly
                  ? "Dia único: receita por hora, de 00h até 23h."
                  : "Bruta inclui vendas pagas; líquida só as concluídas."}
              </p>
            </div>

            {hasChartData ? (
              <ChartContainer
                config={revenueConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillGross" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-gross)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-gross)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-net)"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-net)"
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={isHourly ? 16 : 24}
                    interval={isHourly ? 2 : "preserveStartEnd"}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={56}
                    tickFormatter={(value) => compactBRL(Number(value))}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(_, payload) => {
                          const raw = payload?.[0]?.payload?.date;
                          if (typeof raw !== "string") return "";
                          if (raw.includes("T")) {
                            const [day, hour] = raw.split("T");
                            return `${new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR")} · ${hour}h`;
                          }
                          return new Date(`${raw}T12:00:00`).toLocaleDateString(
                            "pt-BR",
                          );
                        }}
                        formatter={(value) =>
                          formatBRLFromCents(Math.round(Number(value) * 100))
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    dataKey="gross"
                    type="monotone"
                    fill="url(#fillGross)"
                    stroke="var(--color-gross)"
                    strokeWidth={2}
                  />
                  <Area
                    dataKey="net"
                    type="monotone"
                    fill="url(#fillNet)"
                    stroke="var(--color-net)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="rounded-md border border-dashed border-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
                Ainda não há vendas pagas neste período para montar o gráfico.
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Detalhe dos compradores</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Novos vs. frequentes no período selecionado.
              </p>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                <ChartContainer
                  config={buyersConfig}
                  className="mx-auto aspect-square h-[160px]"
                >
                  {buyers.total > 0 && buyersRadial.length > 0 ? (
                    <RadialBarChart
                      data={buyersRadial}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={48}
                      outerRadius={64}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[54, 42]}
                      />
                      <RadialBar dataKey="value" background cornerRadius={8} />
                      <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                        <Label
                          content={({ viewBox }) => {
                            if (
                              viewBox &&
                              "cx" in viewBox &&
                              "cy" in viewBox
                            ) {
                              return (
                                <text
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-2xl font-bold"
                                  >
                                    {buyers.total}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 18}
                                    className="fill-muted-foreground text-[11px]"
                                  >
                                    total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Sem dados
                    </div>
                  )}
                </ChartContainer>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {buyers.total}
                    </p>
                    <Delta value={comparison.uniqueBuyers} />
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-[var(--chart-1)]" />
                      Frequentes
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {buyers.frequent}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-[var(--chart-2)]" />
                      Novos
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {buyers.new}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Taxa de recompra
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {buyers.repurchaseRatePercent}%
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Taxa de conclusão</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Quanto das vendas do período chegaram a concluídas.
              </p>
              <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
                <ChartContainer
                  config={conversionConfig}
                  className="mx-auto aspect-square h-[160px]"
                >
                  <RadialBarChart
                    data={conversionRadial}
                    startAngle={90}
                    endAngle={90 - (kpis.conversionPercent / 100) * 360}
                    innerRadius={52}
                    outerRadius={64}
                  >
                    <PolarGrid
                      gridType="circle"
                      radialLines={false}
                      stroke="none"
                      className="first:fill-muted last:fill-background"
                      polarRadius={[58, 46]}
                    />
                    <RadialBar dataKey="value" background cornerRadius={10} />
                    <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  {kpis.conversionPercent}%
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </PolarRadiusAxis>
                  </RadialBarChart>
                </ChartContainer>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Concluídas</span>
                    <span className="tabular-nums font-medium">
                      {kpis.completedCount}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Em andamento</span>
                    <span className="tabular-nums font-medium">
                      {kpis.pendingCount}
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Canceladas</span>
                    <span className="tabular-nums font-medium">
                      {kpis.cancelledCount}
                    </span>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Concentração de vendas por dia e horário
                </h2>
                <p className="text-sm text-muted-foreground">
                  Quando suas vendas costumam acontecer (fuso de Brasília).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Vendas totais</p>
                  <p className="font-semibold tabular-nums">
                    {heatmap.totalSales}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Média / dia da semana</p>
                  <p className="font-semibold tabular-nums">
                    {heatmap.avgDailySales}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dia com mais vendas</p>
                  <p className="font-semibold">{heatmap.peakWeekdayLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Horário de pico</p>
                  <p className="font-semibold">{heatmap.peakHourLabel}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="mb-1 grid grid-cols-[72px_repeat(24,minmax(0,1fr))] gap-0.5 text-[10px] text-muted-foreground">
                  <span />
                  {Array.from({ length: 24 }, (_, hour) => (
                    <span key={hour} className="text-center tabular-nums">
                      {String(hour).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                {Array.from({ length: 7 }, (_, weekday) => (
                  <div
                    key={weekday}
                    className="mb-0.5 grid grid-cols-[72px_repeat(24,minmax(0,1fr))] gap-0.5"
                  >
                    <span className="truncate pr-1 text-[11px] text-muted-foreground">
                      {
                        heatmap.cells.find((c) => c.weekday === weekday)
                          ?.weekdayLabel
                      }
                    </span>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const cell = heatmap.cells.find(
                        (c) => c.weekday === weekday && c.hour === hour,
                      );
                      const sales = cell?.sales ?? 0;
                      return (
                        <div
                          key={hour}
                          title={`${cell?.weekdayLabel ?? ""} ${String(hour).padStart(2, "0")}h: ${sales} venda(s)`}
                          className={cn(
                            "aspect-square rounded-[2px]",
                            heatmapTone(sales, heatmap.max),
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-muted/50" /> Sem
                    vendas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-primary/25" /> Baixo
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-primary/55" /> Médio
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-primary" /> Alto
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Status das vendas</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Distribuição de todos os pedidos criados no período.
              </p>
              {statusTotal === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem pedidos no período.
                </p>
              ) : (
                <ul className="space-y-3">
                  {metrics.byStatus.map((row) => {
                    const pct = Math.round((row.count / statusTotal) * 100);
                    return (
                      <li key={row.status} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span>{orderStatusLabel(row.status)}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {row.count} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">
                Anúncios que mais venderam
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Ranking por receita bruta no período.
              </p>
              {metrics.topListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma venda paga ainda.{" "}
                  <Link href={routes.sell} className="text-primary hover:underline">
                    Criar anúncio
                  </Link>
                </p>
              ) : (
                <ol className="space-y-3">
                  {metrics.topListings.map((row, index) => (
                    <li key={row.listingId} className="flex items-center gap-3">
                      <span className="w-5 text-xs font-medium tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <Link
                          href={routes.listing(row.listingId)}
                          className="line-clamp-1 text-sm font-medium hover:underline"
                        >
                          {row.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {row.sales}{" "}
                          {row.sales === 1 ? "venda" : "vendas"} ·{" "}
                          {row.uniqueVisits} visitas · {row.conversionPercent}%
                          conv.
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-primary">
                        {formatBRLFromCents(row.revenueCents)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {tab === "listings" ? (
        <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">
                Desempenho dos seus anúncios
              </h2>
              <p className="text-sm text-muted-foreground">
                {listings.length}{" "}
                {listings.length === 1 ? "anúncio" : "anúncios"} com vendas no
                período.
              </p>
            </div>
          </div>
          {listings.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
              Não há vendas para mostrar neste período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border/60 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 font-medium">Anúncio</th>
                    <th className="px-2 py-2 font-medium">Vendas brutas</th>
                    <th className="px-2 py-2 font-medium">Qtd. vendas</th>
                    <th className="px-2 py-2 font-medium">Visitas</th>
                    <th className="px-2 py-2 font-medium">Conversão</th>
                    <th className="px-2 py-2 font-medium">Compradores</th>
                    <th className="px-2 py-2 font-medium">% participação</th>
                    <th className="px-2 py-2 font-medium">Você recebeu</th>
                    <th className="px-2 py-2 font-medium">Rentabilidade</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((row) => (
                    <tr
                      key={row.listingId}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="px-2 py-3">
                        <Link
                          href={routes.listing(row.listingId)}
                          className="line-clamp-1 font-medium hover:underline"
                        >
                          {row.title}
                        </Link>
                      </td>
                      <td className="px-2 py-3 tabular-nums">
                        {formatBRLFromCents(row.revenueCents)}
                      </td>
                      <td className="px-2 py-3 tabular-nums">{row.sales}</td>
                      <td className="px-2 py-3 tabular-nums">
                        {row.uniqueVisits}
                      </td>
                      <td className="px-2 py-3 tabular-nums">
                        {row.conversionPercent}%
                      </td>
                      <td className="px-2 py-3 tabular-nums">{row.buyers}</td>
                      <td className="px-2 py-3 tabular-nums">
                        {row.sharePercent}%
                      </td>
                      <td className="px-2 py-3 tabular-nums">
                        {formatBRLFromCents(row.netCents)}
                      </td>
                      <td className="px-2 py-3 tabular-nums">
                        {row.profitabilityPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "costs" ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Vendas concluídas"
              value={formatBRLFromCents(kpis.grossCents)}
              hint={`${kpis.completedCount} unidades / vendas pagas no recorte`}
              delta={comparison.grossCents}
            />
            <MetricCard
              label="Tarifas e investimentos"
              value={formatBRLFromCents(costs.feesCents)}
              hint={`${costs.feeSharePercent}% das vendas brutas`}
            />
            <MetricCard
              featured
              label="Você recebeu"
              value={formatBRLFromCents(costs.netCents)}
              hint="Após taxa da plataforma"
              delta={comparison.netCents}
            />
          </div>

          <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <h2 className="text-base font-semibold">Distribuição dos custos</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Hoje o Elloot só registra a taxa da plataforma. Publicidade e
              envios entram depois.
            </p>
            <div className="grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
              <ChartContainer
                config={costsConfig}
                className="mx-auto aspect-square h-[180px]"
              >
                <RadialBarChart
                  data={costsRadial}
                  startAngle={90}
                  endAngle={
                    90 -
                    ((costs.grossCents > 0
                      ? costs.netCents / costs.grossCents
                      : 0) /
                      1) *
                    360
                  }
                  innerRadius={58}
                  outerRadius={64}
                >
                  <PolarGrid
                    gridType="circle"
                    radialLines={false}
                    stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[64, 52]}
                  />
                  <RadialBar dataKey="value" background cornerRadius={10} />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          const pct =
                            costs.grossCents > 0
                              ? Math.round(
                                (costs.netCents / costs.grossCents) * 100,
                              )
                              : 0;
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {pct}%
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 18}
                                className="fill-muted-foreground text-[11px]"
                              >
                                líquido
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </PolarRadiusAxis>
                </RadialBarChart>
              </ChartContainer>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-[var(--chart-2)]" />
                    Tarifas de venda
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatBRLFromCents(costs.feesCents)}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full bg-[var(--chart-1)]" />
                    Você recebeu
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatBRLFromCents(costs.netCents)}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
            <h2 className="mb-4 text-base font-semibold">Custos por anúncio</h2>
            {listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Não há vendas neste período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 font-medium">Anúncio</th>
                      <th className="px-2 py-2 font-medium">
                        Vendas concluídas
                      </th>
                      <th className="px-2 py-2 font-medium">
                        Tarifas e investimentos
                      </th>
                      <th className="px-2 py-2 font-medium">Você recebeu</th>
                      <th className="px-2 py-2 font-medium">Rentabilidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((row) => (
                      <tr
                        key={row.listingId}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-2 py-3">
                          <Link
                            href={routes.listing(row.listingId)}
                            className="line-clamp-2 font-medium hover:underline"
                          >
                            {row.title}
                          </Link>
                        </td>
                        <td className="px-2 py-3 tabular-nums">
                          {formatBRLFromCents(row.revenueCents)}
                        </td>
                        <td className="px-2 py-3 tabular-nums">
                          {formatBRLFromCents(row.feesCents)}
                        </td>
                        <td className="px-2 py-3 tabular-nums">
                          {formatBRLFromCents(row.netCents)}
                        </td>
                        <td className="px-2 py-3 tabular-nums">
                          {row.profitabilityPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === "service" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Disputas</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Pedidos em disputa no período.
              </p>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold tabular-nums">
                    {kpis.disputedCount}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {statusTotal > 0
                      ? `${Math.round((kpis.disputedCount / statusTotal) * 1000) / 10}% dos pedidos`
                      : "Sem pedidos"}
                  </p>
                  <div className="mt-2">
                    <Delta value={comparison.disputedCount} />
                  </div>
                </div>
              </div>
            </section>
            <section className="rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h2 className="text-base font-semibold">Cancelamentos</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Cancelados, expirados ou reembolsados.
              </p>
              <div>
                <p className="text-3xl font-bold tabular-nums">
                  {kpis.cancelledCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBRLFromCents(kpis.cancelledCents)} em valor
                </p>
                <div className="mt-2">
                  <Delta value={comparison.cancelledCount} />
                </div>
              </div>
            </section>
          </div>
          <p className="rounded-md border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Motivos detalhados de reclamação, mediação e envios incorretos
            exigem mais eventos de atendimento — vamos adicionar quando o fluxo
            de disputas estiver completo no app.
          </p>
        </div>
      ) : null}
    </div>
  );
};