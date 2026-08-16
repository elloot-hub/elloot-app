"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  MessageSquareIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  cancelOrder,
  confirmOrder,
  confirmSandboxPayment,
  deliverOrder,
  fetchOrder,
  fetchPaymentMethods,
  startCheckout,
  syncEfiPayment,
  type PaymentMethod,
} from "@/features/orders/api";
import { orderStatusLabel } from "@/features/orders/labels";
import type { Order, OrderCheckout } from "@/features/orders/types";
import {
  PaymentCheckoutPanel,
  type CheckoutUiPhase,
} from "@/features/orders/components/payment-checkout-panel";
import { OrderPaymentSummary } from "@/features/orders/components/order-payment-summary";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { OrderReviewForm } from "@/features/orders/components/order-review-form";
import { OrderDetailSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  orderId: string;
};

export function OrderDetailClient({ orderId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [checkout, setCheckout] = useState<OrderCheckout | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [phase, setPhase] = useState<CheckoutUiPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const refresh = useCallback(async () => {
    const { order: next } = await fetchOrder(orderId);
    setOrder(next);
    return next;
  }, [orderId]);

  const handlePaidRedirect = useCallback(
    (paidOrder: Order) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setPhase("paid");
      setMessage("Pagamento confirmado. Escrow ativado.");
      const chatId = paidOrder.conversation?.id;
      window.setTimeout(() => {
        if (chatId) {
          router.push(routes.conversation(chatId));
        } else {
          router.replace(routes.order(paidOrder.id));
        }
      }, 1200);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
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

  useEffect(() => {
    if (!order || order.status !== "PENDING_PAYMENT" || !user) return;
    if (user.id !== order.buyer.id) return;

    let cancelled = false;
    (async () => {
      setMethodsLoading(true);
      try {
        const res = await fetchPaymentMethods();
        if (!cancelled) setMethods(res.methods);
      } catch {
        if (!cancelled) {
          setMethods([
            {
              id: "pix",
              label: "PIX",
              hint: "Aprovação na hora",
              available: true,
            },
            {
              id: "card",
              label: "Cartão",
              hint: "Em breve",
              available: false,
            },
          ]);
        }
      } finally {
        if (!cancelled) setMethodsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order, user]);

  useEffect(() => {
    if (!order || order.status !== "PENDING_PAYMENT" || !user) return;
    if (user.id !== order.buyer.id) return;

    let cancelled = false;
    (async () => {
      setCheckoutLoading(true);
      setPhase("loading");
      try {
        const { checkout: next } = await startCheckout(order.id);
        if (!cancelled) {
          setCheckout(next);
          const expired =
            next.expiresAt && new Date(next.expiresAt).getTime() <= Date.now();
          setPhase(expired ? "expired" : "ready");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível iniciar o pagamento.",
          );
          setPhase("ready");
        }
      } finally {
        if (!cancelled) setCheckoutLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [order, user]);

  // Poll order status (sandbox + efi) while awaiting payment.
  useEffect(() => {
    if (!order || order.status !== "PENDING_PAYMENT" || !user) return;
    if (user.id !== order.buyer.id) return;

    let cancelled = false;

    const pollOrder = async () => {
      try {
        const next = await refresh();
        if (cancelled) return;
        if (next.status === "PAID" || next.status === "EXPIRED") {
          if (next.status === "PAID") handlePaidRedirect(next);
          if (next.status === "EXPIRED") setPhase("expired");
        }
      } catch {
        // ignore transient
      }
    };

    const intervalId = window.setInterval(() => void pollOrder(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [order, user, refresh, handlePaidRedirect]);

  // Extra Efi sync polling.
  useEffect(() => {
    if (
      !checkout ||
      checkout.provider !== "efi" ||
      order?.status !== "PENDING_PAYMENT"
    ) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await syncEfiPayment(checkout.providerRef);
        if (cancelled || !result.orderId) return;
        const next = await refresh();
        handlePaidRedirect(next);
      } catch {
        // Ignora falhas transitórias do polling.
      }
    };

    void poll();
    const intervalId = window.setInterval(() => void poll(), 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [checkout, order?.status, refresh, handlePaidRedirect]);

  useEffect(() => {
    const expiresAt = checkout?.expiresAt ?? order?.expiresAt;
    if (!expiresAt || order?.status !== "PENDING_PAYMENT") return;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) {
      setPhase("expired");
      return;
    }
    const id = window.setTimeout(() => setPhase("expired"), ms);
    return () => window.clearTimeout(id);
  }, [checkout?.expiresAt, order?.expiresAt, order?.status]);

  const isBuyer = Boolean(user && order && user.id === order.buyer.id);
  const isSeller = Boolean(user && order && user.id === order.seller.id);
  const awaitingPayment = order?.status === "PENDING_PAYMENT" && isBuyer;

  async function runAction(action: () => Promise<Order | void>) {
    setActionPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await action();
      const next = result ?? (await refresh());
      return next;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Ação não concluída.",
      );
      return null;
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error ?? "Pedido não encontrado."}
        </p>
        <Link href={routes.orders} className={cn(buttonVariants())}>
          Voltar aos pedidos
        </Link>
      </div>
    );
  }

  const cover = order.listing.media[0]?.url;
  const shortId = order.id.slice(-8).toUpperCase();

  if (awaitingPayment) {
    return (
      <div className="space-y-6 min-w-0 max-w-full">
        <div className="flex flex-col gap-2">
          <Badge variant="default">
            Aguardando pagamento
          </Badge>
          <h1 className="min-w-0 text-2xl font-semibold break-words sm:text-3xl">
            Pedido #{shortId}
          </h1>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:items-start lg:gap-8">
          <div className="order-1 min-w-0 max-w-full space-y-4">
            <PaymentCheckoutPanel
              checkout={checkout}
              loadingCheckout={checkoutLoading}
              amountCents={order.amountCents}
              expiresAt={order.expiresAt}
              listingTitle={order.listing.title}
              methods={methods}
              methodsLoading={methodsLoading}
              phase={phase}
              actionPending={actionPending}
              statusMessage={message}
              onSyncEfi={() =>
                void runAction(async () => {
                  if (!checkout?.providerRef) return;
                  setPhase("awaiting");
                  setMessage(
                    "Aguardando confirmação. Detectamos o pagamento automaticamente. Mantenha a página aberta.",
                  );
                  const result = await syncEfiPayment(checkout.providerRef);
                  if (result.orderId) {
                    const next = await refresh();
                    handlePaidRedirect(next);
                    return next;
                  }
                  setMessage(
                    "Pagamento ainda não identificado. Continuamos verificando…",
                  );
                  setPhase("awaiting");
                })
              }
              onConfirmSandbox={() =>
                void runAction(async () => {
                  const ref = checkout?.providerRef;
                  if (!ref) return;
                  setPhase("awaiting");
                  await confirmSandboxPayment(ref);
                  const next = await refresh();
                  handlePaidRedirect(next);
                  return next;
                })
              }
              onCancel={() =>
                void runAction(async () => {
                  await cancelOrder(order.id);
                  setMessage("Pedido cancelado.");
                  const next = await refresh();
                  return next;
                })
              }
              onRenew={() => {
                router.push(routes.listing(order.listing.id));
              }}
            />
          </div>

          <div className="order-2 min-w-0 max-w-full space-y-4 lg:sticky lg:top-24">
            <OrderPaymentSummary
              orderId={order.id}
              listing={{
                id: order.listing.id,
                title: order.listing.title,
                coverUrl: cover,
                offerTitle: order.offer?.title ?? null,
              }}
              amountCents={order.amountCents}
              feeCents={order.feeCents}
              methodLabel="PIX"
              sellerName={order.seller.name ?? order.seller.email}
            />

            <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
              <h3 className="text-sm font-semibold">Linha do tempo</h3>
              <ul className="min-w-0 space-y-3">
                <li className="flex min-w-0 gap-3">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Pedido criado</p>
                    <p className="text-xs text-muted-foreground">
                      Aguardando pagamento PIX
                    </p>
                  </div>
                </li>
                <li className="flex min-w-0 gap-3 opacity-50">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Pagamento confirmado</p>
                    <p className="text-xs text-muted-foreground">Próximo passo</p>
                  </div>
                </li>
                <li className="flex min-w-0 gap-3 opacity-50">
                  <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Entrega e liberação</p>
                    <p className="text-xs text-muted-foreground">Após confirmação</p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex min-w-0 flex-col gap-2">
        <Badge
          variant={
            order.status === "CANCELLED" || order.status === "REFUNDED"
              ? "destructive"
              : order.status === "COMPLETED"
                ? "secondary"
                : order.status === "DISPUTED"
                  ? "outline"
                  : "default"
          }
          className={cn(
            order.status === "COMPLETED" &&
              "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            order.status === "EXPIRED" &&
              "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
            order.status === "DISPUTED" &&
              "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
          )}
        >
          {orderStatusLabel(order.status)}
        </Badge>
        <h1 className="min-w-0 break-words text-2xl font-semibold sm:text-3xl">
          Pedido #{shortId}
        </h1>
        <p className="min-w-0 text-sm text-muted-foreground text-pretty">
          <span className="break-words">{order.listing.title}</span>
          {" · "}
          Criado {formatRelativeTime(order.createdAt)}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)] lg:items-start lg:gap-8">
        <div className="order-1 min-w-0 max-w-full space-y-4">
          <OrderDetailsBlock order={order} />

          {order.status === "PAID" && isSeller ? (
            <div className="space-y-4 rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
              <div className="flex items-start gap-2 text-sm">
                <PackageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-muted-foreground text-pretty">
                  Entregue o produto pelo fluxo da plataforma e marque como
                  entregue.
                </p>
              </div>
              <Button
                className="h-11 w-full"
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
            <div className="space-y-4 rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <p className="text-muted-foreground text-pretty">
                  Confirme apenas se recebeu o que comprou. Isso libera o
                  escrow para o vendedor.
                </p>
              </div>
              <Button
                className="h-11 w-full"
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

          {order.dispute ? (
            <div className="space-y-3 rounded-md border border-orange-500/25 bg-orange-500/10 p-4 sm:p-5">
              <p className="text-sm font-medium">Disputa aberta</p>
              <p className="text-sm text-muted-foreground text-pretty">
                O escrow permanece retido. Acompanhe e alinhe detalhes pelo
                chat do pedido.
              </p>
              {order.conversation?.id ? (
                <Link
                  href={routes.conversation(order.conversation.id)}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 w-full",
                  )}
                >
                  Abrir chat da disputa
                </Link>
              ) : null}
            </div>
          ) : (isBuyer || isSeller) &&
            (order.status === "PAID" || order.status === "DELIVERED") &&
            order.conversation?.id ? (
            <p className="rounded-md border border-border/60 bg-card/40 px-4 py-3 text-xs text-muted-foreground text-pretty">
              Problema com a entrega? Use{" "}
              <Link
                href={routes.conversation(order.conversation.id)}
                className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Relatar problema
              </Link>{" "}
              no chat do pedido.
            </p>
          ) : null}

          {order.status === "COMPLETED" ? (
            <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
              <p>
                Pedido concluído com sucesso. O valor foi liberado ao vendedor.
              </p>
            </div>
          ) : null}

          {order.status === "COMPLETED" && isBuyer ? (
            <OrderReviewForm
              orderId={order.id}
              alreadyReviewed={Boolean(order.review)}
              onSubmitted={() => void refresh()}
            />
          ) : null}
        </div>

        <div className="order-2 min-w-0 max-w-full space-y-4 lg:sticky lg:top-24">
          <OrderPaymentSummary
            orderId={order.id}
            listing={{
              id: order.listing.id,
              title: order.listing.title,
              coverUrl: cover,
              offerTitle: order.offer?.title ?? null,
            }}
            amountCents={order.amountCents}
            feeCents={order.feeCents}
            methodLabel="PIX"
            sellerName={order.seller.name ?? order.seller.email}
          />

          <OrderTimeline status={order.status} />

          {order.conversation?.id ? (
            <Link
              href={routes.conversation(order.conversation.id)}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "w-full justify-center gap-2",
              )}
            >
              <MessageSquareIcon className="size-4" />
              Abrir chat
            </Link>
          ) : (
            <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-center text-xs text-muted-foreground">
              O chat fica disponível após o pagamento do pedido.
            </p>
          )}

          <Link
            href={routes.orders}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full justify-center",
            )}
          >
            Ver todos os pedidos
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ status }: { status: Order["status"] }) {
  const steps = [
    {
      id: "created",
      title: "Pedido criado",
      hint: "Registro inicial",
      done: true,
    },
    {
      id: "paid",
      title: "Pagamento confirmado",
      hint: "PIX aprovado",
      done: ["PAID", "DELIVERED", "COMPLETED", "DISPUTED"].includes(status),
    },
    {
      id: "delivery",
      title: "Entrega e liberação",
      hint: "Confirmação do comprador",
      done: status === "COMPLETED",
    },
  ] as const;

  const cancelled =
    status === "CANCELLED" || status === "EXPIRED" || status === "REFUNDED";

  return (
    <section className="min-w-0 max-w-full space-y-3 overflow-hidden rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <h3 className="text-sm font-semibold">Linha do tempo</h3>
      <ul className="min-w-0 space-y-3">
        {steps.map((step) => {
          const active = step.done && !cancelled;
          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-0 gap-3",
                !active && !cancelled && "opacity-50",
                cancelled && step.id !== "created" && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  active || (cancelled && step.id === "created")
                    ? "bg-primary"
                    : "bg-muted-foreground/40",
                )}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.hint}</p>
              </div>
            </li>
          );
        })}
        {cancelled ? (
          <li className="flex min-w-0 gap-3">
            <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-destructive" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {status === "EXPIRED"
                  ? "Pedido expirado"
                  : status === "REFUNDED"
                    ? "Reembolsado"
                    : "Pedido cancelado"}
              </p>
              <p className="text-xs text-muted-foreground">Fluxo encerrado</p>
            </div>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function OrderDetailsBlock({ order }: { order: Order }) {
  const cover = order.listing.media[0]?.url;
  return (
    <>
      <div className="flex min-w-0 gap-4 overflow-hidden rounded-md border border-border/60 bg-card/50 p-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              className="size-full object-cover select-none pointer-events-none"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Elloot
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
          <Link
            href={routes.listing(order.listing.id)}
            className="text-sm font-medium hover:text-primary"
          >
            Ver anúncio
          </Link>
          <p className="text-lg font-semibold tabular-nums text-primary">
            {formatBRLFromCents(order.amountCents)}
          </p>
          {order.offer ? (
            <p className="truncate text-sm text-muted-foreground">
              Oferta: {order.offer.title}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Taxa da plataforma: {formatBRLFromCents(order.feeCents)}
          </p>
        </div>
      </div>

      <dl className="grid min-w-0 gap-3 overflow-hidden rounded-md border border-border/60 bg-card/40 p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-muted-foreground">Comprador</dt>
          <dd className="mt-1 truncate font-medium">
            {order.buyer.name ?? order.buyer.email}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Vendedor</dt>
          <dd className="mt-1 truncate font-medium">
            {order.seller.name ?? order.seller.email}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-muted-foreground">Criado em</dt>
          <dd className="mt-1 font-mono text-xs">
            {new Date(order.createdAt).toLocaleString("pt-BR")}
          </dd>
        </div>
        {order.escrowHold ? (
          <div className="min-w-0">
            <dt className="text-muted-foreground">Escrow</dt>
            <dd className="mt-1 font-medium">
              {formatBRLFromCents(order.escrowHold.amountCents)}
              {order.escrowHold.releasedAt ? " · liberado" : " · retido"}
            </dd>
          </div>
        ) : null}
      </dl>
    </>
  );
}
