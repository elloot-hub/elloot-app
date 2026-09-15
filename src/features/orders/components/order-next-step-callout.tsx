"use client";

import type { OrderNextStep } from "@/features/orders/order-flow";
import { cn } from "@/lib/utils";

type Props = {
  step: OrderNextStep;
  className?: string;
};

const TONE_STYLES: Record<OrderNextStep["tone"], string> = {
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  info: "border-primary/25 bg-primary/10 text-foreground",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function OrderNextStepCallout({ step, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 sm:px-4 sm:py-3",
        TONE_STYLES[step.tone],
        className,
      )}
      role="status"
    >
      <p className="text-sm font-semibold">{step.title}</p>
      <p className="mt-0.5 text-xs leading-relaxed opacity-90">{step.body}</p>
    </div>
  );
}
