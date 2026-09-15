"use client";

import { ThumbsDownIcon, ThumbsUpIcon, MinusIcon } from "lucide-react";
import type { SellerProfileStats } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  stats: SellerProfileStats;
};

export function SellerReputationBar({ stats }: Props) {
  const items = [
    {
      key: "positive",
      label: "Positivas",
      value: stats.positiveCount ?? 0,
      icon: <ThumbsUpIcon className="size-4" />,
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    {
      key: "neutral",
      label: "Neutras",
      value: stats.neutralCount ?? 0,
      icon: <MinusIcon className="size-4" />,
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    {
      key: "negative",
      label: "Negativas",
      value: stats.negativeCount ?? 0,
      icon: <ThumbsDownIcon className="size-4" />,
      className:
        "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    },
  ] as const;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-border/60 bg-card/50 px-4 py-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {item.label}
            </span>
            <span
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full border",
                item.className,
              )}
            >
              {item.icon}
            </span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {item.value.toLocaleString("pt-BR")}
          </p>
        </div>
      ))}
    </section>
  );
}
