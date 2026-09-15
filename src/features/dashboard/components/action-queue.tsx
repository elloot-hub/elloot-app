"use client";

import Link from "next/link";
import type { DashboardActionItem } from "@/features/dashboard/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const URGENCY_STRIPE: Record<DashboardActionItem["urgency"], string> = {
  high: "bg-destructive",
  medium: "bg-amber-400",
  low: "bg-primary",
};

type Props = {
  actions: DashboardActionItem[];
  totalCount?: number;
  viewAllHref?: string;
  loading?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyBody?: string;
};

export function DashboardActionQueue({
  actions,
  totalCount,
  viewAllHref,
  loading,
  className,
  emptyTitle = "Tudo em dia",
  emptyBody = "Nenhuma pendência no momento. Novas ações aparecerão aqui.",
}: Props) {
  const count = totalCount ?? actions.length;
  if (loading) {
    return (
      <section
        className={cn("space-y-3", className)}
        aria-busy="true"
        aria-label="Carregando pendências"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-44 animate-pulse rounded-md bg-muted/60" />
          <div className="h-4 w-12 animate-pulse rounded-md bg-muted/40" />
        </div>
        <div className="overflow-hidden rounded-md border border-border/60">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-t border-border/40 px-3 py-3 first:border-t-0"
            >
              <div className="h-10 w-1 animate-pulse rounded-full bg-muted/50" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-3/4 max-w-md animate-pulse rounded-md bg-muted/60" />
                <div className="h-3 w-40 animate-pulse rounded-md bg-muted/40" />
              </div>
              <div className="h-8 w-24 animate-pulse rounded-md bg-muted/50" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (actions.length === 0) {
    return (
      <section
        className={cn(
          "rounded-md border border-border/60 bg-card/30 px-4 py-5 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{emptyBody}</p>
      </section>
    );
  }

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">
          Precisa da sua atenção
        </h2>
        {viewAllHref && count > actions.length ? (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas ({count})
          </Link>
        ) : count > 0 ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {count} {count === 1 ? "item" : "itens"}
          </span>
        ) : null}
      </div>

      <ul className="overflow-hidden rounded-md border border-border/60 bg-card/30">
        {actions.map((action) => (
          <li
            key={action.id}
            className="border-t border-border/40 first:border-t-0"
          >
            <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <span
                className={cn(
                  "w-1 self-stretch rounded-full",
                  URGENCY_STRIPE[action.urgency],
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.meta}</p>
              </div>
              <Link
                href={action.href}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                {action.ctaLabel}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
