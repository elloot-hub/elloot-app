"use client";

import Link from "next/link";
import { WalletIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { DashboardSummaryStats } from "@/features/dashboard/types";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  stats: DashboardSummaryStats;
  className?: string;
};

function releaseHint(stats: DashboardSummaryStats): string {
  if (stats.releasesTodayCents > 0) {
    return `${formatBRLFromCents(stats.releasesTodayCents)} libera hoje`;
  }
  if (stats.inDisputeCents > 0) {
    return `${formatBRLFromCents(stats.inDisputeCents)} em disputa`;
  }
  if (stats.releasesUpcomingCents > 0) {
    return `${formatBRLFromCents(stats.releasesUpcomingCents)} em breve`;
  }
  return "Retido até a confirmação";
}

export function DashboardFinanceStrip({ stats, className }: Props) {
  return (
    <section
      className={cn("grid grid-cols-2 sm:grid-cols-3 gap-2", className)}
      aria-label="Carteira"
    >
      <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary p-4 text-primary-foreground shadow-sm col-span-2 md:col-span-1">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <WalletIcon className="size-4 opacity-90" />
            <p className="text-sm font-medium opacity-90">
              Saldo disponível
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {formatBRLFromCents(stats.balanceCents)}
          </p>
        </div>

        <Link
          href={routes.dashboardWithdrawals}
          className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "border-0 bg-white text-primary hover:bg-white/90 select-none",)}>
          Realizar saque
        </Link>
      </div>

      <Link
        href={routes.dashboardWallet}
        className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/35"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Saldo a liberar
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">
          {formatBRLFromCents(stats.pendingReleaseCents)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {releaseHint(stats)}
        </p>
      </Link>

      <Link
        href={routes.dashboardWithdrawals}
        className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/35"
      >
        <p className="text-sm font-medium text-muted-foreground">
          Saque pendente
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums sm:text-2xl">
          {formatBRLFromCents(stats.pendingPayoutCents)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Solicitações em análise
        </p>
      </Link>
    </section>
  );
}
