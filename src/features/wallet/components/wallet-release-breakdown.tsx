"use client";

import Link from "next/link";
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ClockIcon,
  LockIcon,
} from "lucide-react";
import type { PendingReleaseBreakdown } from "@/features/wallet";
import { formatBRLFromCents, formatDateTimePt } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type WalletReleaseBreakdownProps = {
  pendingRelease: PendingReleaseBreakdown;
  pendingPayoutCents?: number;
  compact?: boolean;
};

function releaseHint(hold: PendingReleaseBreakdown["holds"][number]): string {
  if (hold.status === "DISPUTED") {
    return "Em disputa — valor retido";
  }
  if (hold.releaseAt) {
    const releaseMs = new Date(hold.releaseAt).getTime();
    if (releaseMs <= Date.now()) {
      return "Liberação automática em processamento";
    }
    return `Libera em ${formatDateTimePt(hold.releaseAt)}`;
  }
  return "Aguardando confirmação da entrega";
}

export function WalletReleaseBreakdown({ pendingRelease, pendingPayoutCents = 0, compact = false, }: WalletReleaseBreakdownProps) {
  const { totalCents, releasesTodayCents, releasesUpcomingCents, inDisputeCents, holds, } = pendingRelease;
  if (totalCents === 0 && pendingPayoutCents === 0) {
    return null;
  }

  const buckets = [
    {
      key: "today",
      label: "Libera hoje",
      value: releasesTodayCents,
      icon: ClockIcon,
      tone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "upcoming",
      label: "Próximos dias",
      value: releasesUpcomingCents,
      icon: CalendarClockIcon,
      tone: "text-primary",
    },
    {
      key: "dispute",
      label: "Em disputa",
      value: inDisputeCents,
      icon: AlertTriangleIcon,
      tone: "text-amber-600 dark:text-amber-400",
    },
  ].filter((bucket) => bucket.value > 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Saldo a liberar</h2>
          <p className="text-xs text-muted-foreground">
            Valores retidos em escrow até confirmação ou prazo automático
          </p>
        </div>
        {!compact ? (
          <p className="text-lg font-bold text-primary tabular-nums">
            {formatBRLFromCents(totalCents)}
          </p>
        ) : null}
      </div>

      {buckets.length > 0 ? (
        <div
          className={cn(
            "grid gap-2",
            compact ? "sm:grid-cols-3" : "sm:grid-cols-3",
          )}
        >
          {buckets.map((bucket) => (
            <div
              key={bucket.key}
              className="rounded-md border border-border/60 bg-card/40 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <bucket.icon className={cn("size-3.5", bucket.tone)} />
                {bucket.label}
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatBRLFromCents(bucket.value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {pendingPayoutCents > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <LockIcon className="size-4" />
            Saque em processamento
          </div>
          <span className="font-semibold tabular-nums">
            {formatBRLFromCents(pendingPayoutCents)}
          </span>
        </div>
      ) : null}

      {!compact && holds.length > 0 ? (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
          {holds.map((hold) => (
            <li key={hold.orderId}>
              <Link
                href={routes.order(hold.orderCode)}
                className="flex items-start justify-between gap-3 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-pretty break-words">
                    {hold.listingTitle}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-primary/80">
                    {hold.orderCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {releaseHint(hold)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                  {formatBRLFromCents(hold.netCents)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
