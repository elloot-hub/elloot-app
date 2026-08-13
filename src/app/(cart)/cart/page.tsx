"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle2Icon, ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon, } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { fetchCatalogListings } from "@/features/catalog/api";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { useCart } from "@/features/cart";
import { useAuth } from "@/features/auth/context";
import { createOrder } from "@/features/orders/api";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ListingSummary } from "@/types/api";

function RecentListingsCarousel() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadListings() {
      try {
        const res = await fetchCatalogListings({ limit: 10 });
        setListings(res.listings);
      } catch (err) {
        console.error("Erro ao carregar anúncios recentes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!loading && listings.length === 0) return null;

  return (
    <div className="pt-8 border-t border-border/60 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Anúncios recentes no Mercado
          </h2>
          <p className="text-xs text-muted-foreground">
            Confira as últimas ofertas publicadas no marketplace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Anterior"
              className="flex size-8 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Próximo"
              className="flex size-8 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>

          <Link
            href={routes.market}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1 text-xs",
            )}
          >
            Abrir mercado
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-md border border-border/50 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1 snap-x"
          >
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="w-[240px] sm:w-[260px] shrink-0 snap-start"
              >
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotalCents,
    itemCount,
  } = useCart();

  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function onCheckout() {
    setCheckoutError(null);

    if (!user) {
      router.push(
        `${routes.login}?next=${encodeURIComponent(routes.cart)}`,
      );
      return;
    }

    if (items.length === 0) return;

    const snapshot = items.map((item) => ({ ...item }));
    setCheckoutPending(true);

    const createdIds: string[] = [];
    let lineIndex = 0;
    let unitsDone = 0;

    try {
      for (; lineIndex < snapshot.length; lineIndex++) {
        const item = snapshot[lineIndex];
        unitsDone = 0;

        if (user.id === item.sellerId) {
          throw new Error(
            `Você não pode comprar o próprio anúncio: ${item.title}`,
          );
        }

        for (; unitsDone < item.quantity; unitsDone++) {
          const { order } = await createOrder(item.listingId, item.offerId);
          createdIds.push(order.id);
        }
      }

      clearCart();

      if (createdIds.length === 1) {
        router.push(routes.order(createdIds[0]));
      } else {
        router.push(routes.dashboardPurchases);
      }
    } catch (err) {
      for (let i = 0; i < lineIndex; i++) {
        removeItem(snapshot[i].id);
      }
      if (lineIndex < snapshot.length && unitsDone > 0) {
        const current = snapshot[lineIndex];
        const left = current.quantity - unitsDone;
        if (left <= 0) removeItem(current.id);
        else updateQuantity(current.id, left);
      }

      if (createdIds.length > 0) {
        setCheckoutError(
          `${createdIds.length} pedido(s) criado(s). Alguns itens falharam e permaneceram no carrinho.`,
        );
      } else {
        setCheckoutError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Não foi possível criar os pedidos.",
        );
      }
    } finally {
      setCheckoutPending(false);
    }
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Carrinho de Compras
            </h1>
            <p className="text-sm text-muted-foreground">
              {itemCount > 0
                ? `Você tem ${itemCount} ${itemCount === 1 ? "item" : "itens"} no carrinho.`
                : "Seu carrinho está vazio."}
            </p>
          </div>

          <Link
            href={routes.market}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Continuar comprando
          </Link>
        </div>

        {items.length === 0 ? (
          <>
            <div className="surface-panel flex flex-col items-center justify-center p-12 text-center">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <ShoppingBagIcon className="size-10 stroke-[1.5]" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Seu carrinho está vazio
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
                Explore o marketplace da Elloot para encontrar contas, itens e
                serviços digitais.
              </p>
              <Link
                href={routes.market}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "mt-6 px-8",
                )}
              >
                Explorar anúncios
              </Link>
            </div>
            <RecentListingsCarousel />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-md border border-border/60 bg-card/30 gap-4 p-4"
                >
                  <div className="flex gap-4 min-w-0">
                    <Link
                      href={routes.listing(item.listingId)}
                      className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-md border border-border/60 bg-muted"
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover pointer-events-none"
                      />
                    </Link>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {item.category ? (
                        <Badge variant="default">{item.category}</Badge>
                      ) : null}

                      <Link
                        href={routes.listing(item.listingId)}
                        className="block text-sm font-semibold sm:text-base text-foreground leading-snug line-clamp-2 hover:underline"
                      >
                        {item.title}
                      </Link>

                      {item.seller ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Vendedor:</span>
                          <span className="font-medium text-foreground">
                            {item.seller.name}
                          </span>
                          {item.seller.verified ? (
                            <CheckCircle2Icon className="size-3 text-primary shrink-0" />
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-sm border border-border/80 bg-background/60 p-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1 || checkoutPending}
                          aria-label="Diminuir"
                          className="flex size-7 items-center justify-center cursor-pointer rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            checkoutPending ||
                            Boolean(item.stock && item.quantity >= item.stock)
                          }
                          aria-label="Aumentar"
                          className="flex size-7 items-center justify-center cursor-pointer rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>

                      <Button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        variant="ghost"
                        size="icon-sm"
                        disabled={checkoutPending}
                        aria-label="Remover item"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>

                    <div className="text-right min-w-fit">
                      <span className="text-base font-medium text-foreground tabular-nums">
                        {formatBRLFromCents(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-md border border-border/60 bg-card/30 space-y-4 p-5 sm:p-6">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Resumo do Pedido
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Subtotal ({itemCount}{" "}
                      {itemCount === 1 ? "item" : "itens"})
                    </span>
                    <span className="text-foreground tabular-nums">
                      {formatBRLFromCents(subtotalCents)}
                    </span>
                  </div>

                  <div className="border-t border-border/60 pt-3 flex items-center justify-between text-base">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-bold text-primary tabular-nums">
                      {formatBRLFromCents(subtotalCents)}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={checkoutPending || authLoading}
                  onClick={() => void onCheckout()}
                >
                  {checkoutPending
                    ? "Criando pedidos…"
                    : user
                      ? "Finalizar com escrow"
                      : "Entrar para finalizar"}
                </Button>

                {checkoutError ? (
                  <p className="text-center text-xs text-destructive" role="alert">
                    {checkoutError}
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">
                    Cada unidade gera um pedido com pagamento em escrow. O valor
                    final é confirmado no checkout.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
