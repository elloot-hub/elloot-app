"use client";

import Link from "next/link";
import { InfoIcon, ShieldCheckIcon } from "lucide-react";
import { formatBRLFromCents } from "@/lib/format";
import { formatOrderCode } from "@/lib/order-code";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  orderCode?: string | null;
  listing: {
    id: string;
    title: string;
    coverUrl?: string | null;
    offerTitle?: string | null;
  };
  amountCents: number;
  feeCents: number;
  methodLabel?: string;
  sellerName?: string | null;
  className?: string;
};

export function OrderPaymentSummary({ orderId, orderCode, listing, amountCents, feeCents, methodLabel = "PIX", sellerName, className, }: Props) {
  const subtotalCents = Math.max(0, amountCents - feeCents);
  const label = formatOrderCode({ id: orderId, code: orderCode });

  return (
    <aside
      className={cn(
        "min-w-0 max-w-full space-y-4 overflow-hidden rounded-md border border-border/60 bg-card/50 p-4 sm:p-5",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">Resumo do pedido</h2>
      </div>

      <div className="flex min-w-0 gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-muted">
          {listing.coverUrl ? (
            <img
              src={listing.coverUrl}
              alt=""
              className="size-full object-cover select-none pointer-events-none"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
              Elloot
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
          <p className="line-clamp-2 break-words text-sm font-medium">
            {listing.title}
          </p>

          {listing.offerTitle ? (
            <p className="truncate text-sm text-muted-foreground">
              {listing.offerTitle}
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            1 × {formatBRLFromCents(subtotalCents)}
          </p>
        </div>
      </div>

      <dl className="min-w-0 space-y-2 border-t border-border/50 pt-3 text-sm">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Entrega</dt>
          <dd className="min-w-0 truncate">Digital</dd>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Pagamento</dt>
          <dd className="min-w-0 truncate">{methodLabel}</dd>
        </div>
        {sellerName ? (
          <div className="flex min-w-0 items-center justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">Vendedor</dt>
            <dd className="min-w-0 truncate text-right">{sellerName}</dd>
          </div>
        ) : null}
      </dl>

      <dl className="space-y-2 border-t border-border/50 pt-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatBRLFromCents(subtotalCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="inline-flex items-center gap-1 text-muted-foreground">
            Taxa de serviço
            <InfoIcon className="size-3.5 opacity-70" aria-hidden />
          </dt>
          <dd className="tabular-nums">{formatBRLFromCents(feeCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <dt className="font-semibold">Total</dt>
          <dd className="text-lg font-bold tabular-nums text-primary">
            {formatBRLFromCents(amountCents)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center gap-2 rounded-sm border border-border/50 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheckIcon
          className="size-3.5 shrink-0 text-emerald-500"
          aria-hidden
        />
        <p className="text-pretty">
          Transação protegida pela Elloot. O valor fica em retido até a
          confirmação da entrega do produto.
        </p>
      </div>
    </aside>
  );
}
