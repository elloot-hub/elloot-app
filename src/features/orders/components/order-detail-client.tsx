"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  PackageIcon,
  ShieldCheckIcon,
  WalletIcon,
} from "lucide-react";
import {
  cancelOrder,
  confirmOrder,
  confirmSandboxPayment,
  deliverOrder,
  fetchOrder,
  startCheckout,
} from "@/features/orders/api";
import {
  orderStatusLabel,
  orderStatusTone,
} from "@/features/orders/labels";
import type { Order, SandboxCheckout } from "@/features/orders/types";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
};

export function OrderDetailClient({ orderId }: Props) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [checkout, setCheckout] = useState<SandboxCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { order: next } = await fetchOrder(orderId);
    setOrder(next);
    return next;
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await refresh();
        if (cancelled) return;
        if (next.status === "PENDING_PAYMENT" && next.payment?.providerRef) {
          setCheckout({
            provider: next.payment.provider,
            providerRef: next.payment.providerRef,
            amountCents: next.payment.amountCents,
            expiresAt: next.expiresAt ?? new Date().toISOString(),
            instructions:
              "Ambiente sandbox: confirme o pagamento abaixo para simular o PIX.",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar o pedido.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const isBuyer = Boolean(user && order && user.id === order.buyer.id);
  const isSeller = Boolean(user && order && user.id === order.seller.id);

  async function runAction(action: () => Promise<void>) {
    setActionPending(true);
    setError(null);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Ação não concluída.",
      );
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Carregando pedido…</p>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error ?? "Pedido não encontrado."}</p>
        <Link href={routes.orders} className={cn(buttonVariants())}>
          Voltar aos pedidos
        </Link>
      </div>
    );
  }

  const cover = order.listing.media[0]?.url;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start">
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
            Pedido
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {order.listing.title}
          </h1>
          <p className={cn("text-sm font-medium", orderStatusTone(order.status))}>
            {orderStatusLabel(order.status)}
          </p>
        </div>

        <div className="flex gap-4 rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                Elloot
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <Link
              href={routes.listing(order.listing.id)}
              className="text-sm font-medium hover:text-primary"
            >
              Ver anúncio
            </Link>
            <p className="font-heading text-lg font-semibold tabular-nums">
              {formatBRLFromCents(order.amountCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              Taxa da plataforma: {formatBRLFromCents(order.feeCents)}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Comprador</dt>
            <dd className="mt-1 font-medium">
              {order.buyer.name ?? order.buyer.email}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Vendedor</dt>
            <dd className="mt-1 font-medium">
              {order.seller.name ?? order.seller.email}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Criado em</dt>
            <dd className="mt-1 font-mono text-xs">
              {new Date(order.createdAt).toLocaleString("pt-BR")}
            </dd>
          </div>
          {order.escrowHold ? (
            <div>
              <dt className="text-muted-foreground">Escrow</dt>
              <dd className="mt-1 font-medium">
                {formatBRLFromCents(order.escrowHold.amountCents)}
                {order.escrowHold.releasedAt ? " · liberado" : " · retido"}
              </dd>
            </div>
          ) : null}
        </dl>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        ) : null}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        {order.status === "PENDING_PAYMENT" && isBuyer ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5 sm:p-6">
            <div className="flex items-start gap-2 text-sm">
              <WalletIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium">Pagamento sandbox</p>
                <p className="text-muted-foreground text-pretty">
                  {checkout?.instructions ??
                    "Simule o PIX para avançar o pedido."}
                </p>
              </div>
            </div>
            {checkout?.pixCopyPaste ? (
              <code className="block break-all rounded-xl bg-muted/50 p-3 font-mono text-xs">
                {checkout.pixCopyPaste}
              </code>
            ) : null}
            <p className="font-mono text-xs text-muted-foreground">
              Ref: {checkout?.providerRef ?? order.payment?.providerRef ?? "—"}
            </p>
            <Button
              className="h-11 w-full rounded-xl"
              disabled={actionPending || !order.payment?.providerRef}
              onClick={() =>
                void runAction(async () => {
                  const ref =
                    order.payment?.providerRef ?? checkout?.providerRef;
                  if (!ref) {
                    const { checkout: next } = await startCheckout(order.id);
                    setCheckout(next);
                    await confirmSandboxPayment(next.providerRef);
                  } else {
                    await confirmSandboxPayment(ref);
                  }
                  setMessage("Pagamento confirmado. Escrow ativado.");
                })
              }
            >
              {actionPending ? "Confirmando…" : "Simular pagamento PIX"}
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl"
              disabled={actionPending}
              onClick={() =>
                void runAction(async () => {
                  await cancelOrder(order.id);
                  setMessage("Pedido cancelado.");
                })
              }
            >
              Cancelar pedido
            </Button>
          </div>
        ) : null}

        {order.status === "PAID" && isSeller ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5">
            <div className="flex items-start gap-2 text-sm">
              <PackageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-muted-foreground text-pretty">
                Entregue o produto pelo fluxo da plataforma e marque como
                entregue.
              </p>
            </div>
            <Button
              className="h-11 w-full rounded-xl"
              disabled={actionPending}
              onClick={() =>
                void runAction(async () => {
                  await deliverOrder(order.id);
                  setMessage("Entrega registrada. Aguardando confirmação.");
                })
              }
            >
              {actionPending ? "Enviando…" : "Marcar como entregue"}
            </Button>
          </div>
        ) : null}

        {(order.status === "PAID" || order.status === "DELIVERED") &&
        isBuyer ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-5">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              <p className="text-muted-foreground text-pretty">
                Confirme apenas se recebeu o que comprou. Isso libera o escrow
                para o vendedor.
              </p>
            </div>
            <Button
              className="h-11 w-full rounded-xl"
              disabled={actionPending}
              onClick={() =>
                void runAction(async () => {
                  await confirmOrder(order.id);
                  setMessage("Pedido concluído. Escrow liberado.");
                })
              }
            >
              {actionPending ? "Confirmando…" : "Confirmar entrega"}
            </Button>
          </div>
        ) : null}

        {order.status === "COMPLETED" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
            <p>Pedido concluído com sucesso. O valor foi liberado ao vendedor.</p>
          </div>
        ) : null}

        <Link
          href={routes.orders}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-center rounded-xl",
          )}
        >
          Ver todos os pedidos
        </Link>
      </aside>
    </div>
  );
}
