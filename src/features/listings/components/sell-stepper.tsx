"use client";

import { cn } from "@/lib/utils";

export type SellStepId = "product" | "offers" | "images" | "review";

const STEPS: Array<{ id: SellStepId; label: string }> = [
  { id: "product", label: "Produto" },
  { id: "offers", label: "Ofertas" },
  { id: "images", label: "Imagens" },
  { id: "review", label: "Revisar" },
];

type Props = {
  current: SellStepId;
  onSelect?: (id: SellStepId) => void;
  maxReachedIndex?: number;
};

export function SellStepper({ current, onSelect, maxReachedIndex = 0, }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav aria-label="Etapas do anúncio" className="w-full">
      <ol className="grid grid-cols-4 gap-2 sm:gap-3 select-none">
        {STEPS.map((step, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          const reachable = index <= maxReachedIndex;
          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                disabled={!reachable || !onSelect}
                onClick={() => onSelect?.(step.id)}
                className={cn(
                  "group flex w-full flex-col gap-2 text-left outline-none",
                  !reachable && "cursor-default opacity-50",
                )}
              >
                <span
                  className={cn(
                    "h-1 w-full rounded-full transition-colors",
                    done || active ? "bg-primary" : "bg-muted",
                  )}
                />
                <span
                  className={cn(
                    "truncate text-center text-sm font-medium",
                    active
                      ? "text-foreground"
                      : done
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
