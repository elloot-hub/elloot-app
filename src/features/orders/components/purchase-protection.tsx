"use client";

import { ShieldCheckIcon } from "lucide-react";

import { useProtectionCountdown } from "@/features/orders/hooks/use-protection-countdown";
import { formatBRLFromCents } from "@/lib/format";
import { cn } from "@/lib/utils";

type Hold = {
  amountCents: number;
  releaseAt: string | null;
  releasedAt: string | null;
};

type Props = {
  hold: Hold;
  /** compact = faixa do chat; default = bloco do pedido */
  variant?: "default" | "compact";
  className?: string;
};

export function PurchaseProtection({
  hold,
  variant = "default",
  className,
}: Props) {
  const active = !hold.releasedAt && Boolean(hold.releaseAt);
  const { label } = useProtectionCountdown(active ? hold.releaseAt : null);

  if (hold.releasedAt) {
    if (variant === "compact") {
      return (
        <p
          className={cn(
            "border-b border-border/60 bg-muted/20 px-3 py-1.5 text-center text-[11px] text-muted-foreground sm:px-4",
            className,
          )}
        >
          Proteção da compra · valor liberado
        </p>
      );
    }
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border border-border/60 bg-card/40 px-3 py-2.5 text-sm",
          className,
        )}
      >
        <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
        <div className="min-w-0">
          <p className="font-medium">Proteção da compra</p>
          <p className="text-xs text-muted-foreground">
            {formatBRLFromCents(hold.amountCents)} · liberado
          </p>
        </div>
      </div>
    );
  }

  if (!active || !label) return null;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "border-b border-border/60 bg-sky-500/10 px-3 py-1.5 text-center text-[11px] text-sky-800 dark:text-sky-200 sm:px-4",
          className,
        )}
        role="status"
      >
        Proteção da compra · {label}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border border-sky-500/25 bg-sky-500/10 px-3 py-2.5 text-sm",
        className,
      )}
      role="status"
    >
      <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium">Proteção da compra</p>
        <p className="text-xs text-muted-foreground">
          {formatBRLFromCents(hold.amountCents)} · {label}
        </p>
      </div>
    </div>
  );
}
