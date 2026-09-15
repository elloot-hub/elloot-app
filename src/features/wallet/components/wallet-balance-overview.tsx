"use client";

import Link from "next/link";
import {
  ArrowUpRightIcon,
  LockIcon,
  WalletIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { PendingReleaseBreakdown } from "@/features/wallet";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  balanceCents: number;
  pendingRelease: PendingReleaseBreakdown;
  pendingPayoutCents: number;
  movementCount: number;
  creditsCents: number;
  debitsCents: number;
};

function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone,
  colSpan,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  icon: typeof WalletIcon;
  tone?: "default" | "warn";
  colSpan?: 2;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5",
            tone === "warn" && "text-amber-600 dark:text-amber-400",
          )}
        />
        {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground text-pretty">
        {hint}
      </p>
    </>
  );

  const className = cn(
    "flex h-full flex-col rounded-md border border-border/60 bg-card/40 p-4 transition-colors",
    colSpan === 2 && "col-span-2",
  );

  if (href) {
    return (
      <Link href={href} className={cn(className, "hover:border-primary/35")}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export function WalletBalanceOverview({
  balanceCents,
  pendingRelease,
  pendingPayoutCents,
}: Props) {
  const releaseHint =
    pendingRelease.releasesTodayCents > 0
      ? `${formatBRLFromCents(pendingRelease.releasesTodayCents)} libera hoje`
      : pendingRelease.inDisputeCents > 0
        ? `${formatBRLFromCents(pendingRelease.inDisputeCents)} em disputa`
        : pendingRelease.releasesUpcomingCents > 0
          ? `${formatBRLFromCents(pendingRelease.releasesUpcomingCents)} em breve`
          : "Retido até confirmação";

  return (
    <section className="space-y-2" aria-label="Resumo da carteira">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:items-stretch">
        <div className="col-span-2 flex h-full items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary p-4 text-primary-foreground shadow-sm sm:col-span-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <WalletIcon className="size-4 shrink-0 opacity-90" />
              <p className="text-sm font-medium opacity-90">Saldo disponível</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatBRLFromCents(balanceCents)}
            </p>
          </div>
          <Link
            href={routes.dashboardWithdrawals}
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "shrink-0 border-0 bg-white text-primary hover:bg-white/90",
            )}
          >
            Realizar saque
          </Link>
        </div>

        <StatCard
          label="Saldo a liberar"
          value={formatBRLFromCents(pendingRelease.totalCents)}
          hint={releaseHint}
          href={routes.dashboardSales}
          icon={LockIcon}
        />

        <StatCard
          label="Saque pendente"
          value={formatBRLFromCents(pendingPayoutCents)}
          hint={
            pendingPayoutCents > 0
              ? "Solicitações em análise"
              : "Nenhum saque em processamento"
          }
          href={routes.dashboardWithdrawals}
          icon={ArrowUpRightIcon}
          tone={pendingPayoutCents > 0 ? "warn" : "default"}
        />
      </div>
    </section>
  );
}
