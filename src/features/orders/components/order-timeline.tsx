"use client";

import type { OrderStatus } from "@/features/orders/types";
import {
  buildOrderTimelineSteps,
  type TimelineStepState,
} from "@/features/orders/order-flow";
import { cn } from "@/lib/utils";

type Props = {
  status: OrderStatus;
  variant?: "compact" | "default";
  className?: string;
};

const STATE_STYLES: Record<TimelineStepState, { dot: string; line: string }> = {
  done: {
    dot: "bg-emerald-500",
    line: "bg-emerald-500",
  },
  current: {
    dot: "bg-primary ring-2 ring-primary/30",
    line: "bg-primary/40",
  },
  future: {
    dot: "bg-muted-foreground/30",
    line: "bg-border",
  },
  cancelled: {
    dot: "bg-destructive",
    line: "bg-destructive/40",
  },
};

export function OrderTimeline({
  status,
  variant = "default",
  className,
}: Props) {
  const steps = buildOrderTimelineSteps(status);
  const isCompact = variant === "compact";

  return (
    <div
      className={cn("min-w-0", className)}
      role="list"
      aria-label="Progresso do pedido"
    >
      <div className="flex min-w-0 items-start">
        {steps.map((step, index) => {
          const styles = STATE_STYLES[step.state];
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              role="listitem"
              className={cn("flex min-w-0 flex-1 flex-col items-center", isLast && "flex-none")}
              style={isLast ? { flex: "0 0 auto", width: isCompact ? 12 : 16 } : undefined}
            >
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      steps[index - 1]?.state === "done" ||
                        steps[index - 1]?.state === "current"
                        ? STATE_STYLES.done.line
                        : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
                <span
                  className={cn(
                    "shrink-0 rounded-full",
                    isCompact ? "size-2" : "size-2.5",
                    styles.dot,
                  )}
                  aria-hidden
                />
                {!isLast ? (
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      step.state === "done" ? styles.line : "bg-border",
                    )}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              {!isCompact ? (
                <p
                  className={cn(
                    "mt-1.5 max-w-[4.5rem] text-center text-[10px] leading-tight sm:max-w-none sm:text-xs",
                    step.state === "current"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
              ) : step.state === "current" ? (
                <p className="mt-1 truncate text-[10px] font-medium text-foreground sm:hidden">
                  {step.label}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
