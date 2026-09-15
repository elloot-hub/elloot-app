"use client";

import Link from "next/link";
import type { DashboardSummaryStats } from "@/features/dashboard/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  stats: DashboardSummaryStats;
  className?: string;
};

export function ListingHealthCard({ stats, className }: Props) {
  if (stats.listingsTotal === 0) return null;

  const rows = [
    { label: "Ativos", value: stats.activeListings, tone: "text-foreground" },
    {
      label: "Em moderação",
      value: stats.listingsPendingReview,
      tone: "text-primary",
    },
    {
      label: "Rejeitados",
      value: stats.listingsRejected,
      tone: "text-destructive",
    },
  ];

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Saúde dos anúncios</h3>
        <Link
          href={routes.dashboardListings}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver anúncios
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted-foreground">{row.label}</dt>
            <dd className={cn("mt-0.5 text-lg font-bold tabular-nums", row.tone)}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {stats.listingsRejected > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Você tem anúncios rejeitados — corrija para voltar a vender.
        </p>
      ) : null}
    </div>
  );
}
