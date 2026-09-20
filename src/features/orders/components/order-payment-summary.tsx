"use client";

import Link from "next/link";
import { InfoIcon, ShieldCheckIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  /** Buyer-facing fixed payment fee (snapshot). */
  paymentFeeCents?: number;
  /**
   * Seller-facing reach/platform fee. When `variant` is seller, shown with tooltip.
   * Hidden for buyers.
   */
  feeCents?: number;
  /** Buyer sees product + payment fee; seller sees product − anúncio fee. */
  variant?: "buyer" | "seller";
  methodLabel?: string;
  sellerName?: string | null;
  className?: string;
};

function FeeInfo({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={120}
        render={<span />}
        className="inline-flex size-4 items-center justify-center rounded-sm outline-none"
        aria-label="Mais informações"
      >
        <InfoIcon className="size-3.5 opacity-70" aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[16rem] text-pretty">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function OrderPaymentSummary({
  orderId,
  orderCode,
  listing,
  amountCents,
  paymentFeeCents = 0,
  feeCents = 0,
  variant = "buyer",
  methodLabel = "PIX",
  sellerName,
  className,
}: Props) {
  const label = formatOrderCode({ id: orderId, code: orderCode });
  const isSeller = variant === "seller";
  const totalCents = isSeller
    ? Math.max(0, amountCents - feeCents)
    : amountCents + paymentFeeCents;

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
            1 × {formatBRLFromCents(amountCents)}
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
        <div className="flex min-w-0 items-center justify-between gap-3">
          <dt className="shrink-0 text-muted-foreground">Pedido</dt>
          <dd className="min-w-0 truncate font-mono text-xs">
            <Link href={routes.order(label)} className="hover:text-primary">
              {label}
            </Link>
          </dd>
        </div>
      </dl>

      <dl className="space-y-2 border-t border-border/50 pt-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Produto</dt>
          <dd className="tabular-nums">{formatBRLFromCents(amountCents)}</dd>
        </div>

        {isSeller ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1 text-muted-foreground">
              Taxa do anúncio
              <FeeInfo label="Descontada do valor da venda conforme o plano de alcance do anúncio." />
            </dt>
            <dd className="tabular-nums text-muted-foreground">
              −{formatBRLFromCents(feeCents)}
            </dd>
          </div>
        ) : paymentFeeCents > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1 text-muted-foreground">
              Taxa de pagamento
              <FeeInfo label="Processamento do PIX e proteção da compra." />
            </dt>
            <dd className="tabular-nums">
              {formatBRLFromCents(paymentFeeCents)}
            </dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <dt className="font-semibold">
            {isSeller ? "Você recebe" : "Total"}
          </dt>
          <dd className="text-lg font-bold tabular-nums text-primary">
            {formatBRLFromCents(totalCents)}
          </dd>
        </div>
      </dl>

      {!isSeller && paymentFeeCents > 0 ? (
        <p className="text-[11px] text-muted-foreground text-pretty">
          A taxa de pagamento é cobrada à parte do valor do produto.
        </p>
      ) : null}

      {isSeller ? (
        <p className="text-[11px] text-muted-foreground text-pretty">
          A taxa de pagamento do PIX é cobrada do comprador, não do seu líquido.
        </p>
      ) : null}

      <div className="flex items-center gap-2 rounded-sm border border-border/50 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheckIcon
          className="size-3.5 shrink-0 text-emerald-500"
          aria-hidden
        />
        <p className="text-pretty">
          Transação protegida pela Elloot. O valor fica retido até a
          confirmação da entrega do produto.
        </p>
      </div>
    </aside>
  );
}
