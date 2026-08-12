"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  LockIcon,
  MinusIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TagIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { fetchCatalogListings } from "@/features/catalog/api";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { useCart } from "@/features/cart";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { ListingSummary } from "@/types/api";

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

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
    const distance = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
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
              "rounded-full gap-1 text-xs",
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
        <div className="group relative overflow-hidden">
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
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    serviceFee,
    total,
    itemCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === "ELLOOT10") {
      const discount = subtotal * 0.1;
      setAppliedDiscount(discount);
      setCouponSuccess("Cupom ELLOOT10 aplicado (10% de desconto)!");
    } else if (couponCode.toUpperCase() === "FIRST") {
      setAppliedDiscount(15);
      setCouponSuccess("Cupom FIRST aplicado (R$ 15,00 de desconto)!");
    } else {
      setCouponError("Cupom inválido ou expirado.");
    }
  };

  const finalTotal = Math.max(0, total - appliedDiscount);

  return (
    <div className="py-8 sm:py-12 select-none">
      <Container className="space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={routes.market}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Continuar comprando no Mercado
          </Link>

          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Esvaziar carrinho
            </button>
          ) : null}
        </div>

        {/* Page Title */}
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            Carrinho de Compras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemCount > 0
              ? `Você tem ${itemCount} ${itemCount === 1 ? "item" : "itens"} no seu carrinho de compras.`
              : "Seu carrinho está vazio."}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="surface-panel flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <ShoppingBagIcon className="size-10 stroke-[1.5]" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Seu carrinho está sem nenhum produto
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">
              Explore o marketplace da Elloot para encontrar contas verificadas, skins exclusivas, passe de batalha e moedas digitais.
            </p>
            <Link
              href={routes.market}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "mt-6 px-8",
              )}
            >
              Explorar Anúncios
            </Link>
          </div>
        ) : (
          /* Main 2-Column Grid */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Products List (Left) */}
            <div className="space-y-4 lg:col-span-8">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="surface-panel flex flex-col gap-4 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-4">
                    {/* Item Image */}
                    <div className="relative size-20 sm:size-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover select-none pointer-events-none"
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 flex-1">
                      {item.category ? (
                        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {item.category}
                        </span>
                      ) : null}
                      <h3 className="font-heading text-sm font-semibold sm:text-base text-foreground leading-snug">
                        {item.title}
                      </h3>
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

                  {/* Quantity & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border/80 bg-background/60 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Diminuir"
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-8 text-center  text-sm font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={Boolean(item.stock && item.quantity >= item.stock)}
                          aria-label="Aumentar"
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Remover"
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-24">
                      {item.originalPrice ? (
                        <span className="block text-xs text-muted-foreground line-through">
                          {formatCurrency(item.originalPrice * item.quantity)}
                        </span>
                      ) : null}
                      <span className=" text-base font-bold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon Form */}
              <div className="surface-panel p-4 sm:p-5">
                <form onSubmit={handleApplyCoupon} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <TagIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cupom de desconto (ex: ELLOOT10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full rounded-xl border border-border/80 bg-background/60 pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary select-text"
                    />
                  </div>
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "rounded-xl px-5 text-xs font-semibold",
                    )}
                  >
                    Aplicar Cupom
                  </button>
                </form>
                {couponError ? (
                  <p className="mt-2 text-xs text-destructive">{couponError}</p>
                ) : null}
                {couponSuccess ? (
                  <p className="mt-2 text-xs text-emerald-500 font-medium">{couponSuccess}</p>
                ) : null}
              </div>

              {/* Trust Features */}
              <div className="surface-panel p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheckIcon className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Sistema Escrow</h4>
                    <p className="text-muted-foreground leading-tight mt-0.5">
                      Seu pagamento fica 100% seguro até você receber o produto.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <LockIcon className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Criptografia SSL</h4>
                    <p className="text-muted-foreground leading-tight mt-0.5">
                      Dados trafegados com proteção bancária de ponta a ponta.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2Icon className="size-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Suporte Dedicado</h4>
                    <p className="text-muted-foreground leading-tight mt-0.5">
                      Equipe pronta para ajudar em mediações 24 horas por dia.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Panel (Right) */}
            <div className="lg:col-span-4">
              <div className="surface-panel sticky top-24 space-y-5 p-5 sm:p-6">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Resumo do Pedido
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({itemCount} itens)</span>
                    <span className=" text-foreground">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de Proteção & Escrow</span>
                    <span className=" text-foreground">
                      {serviceFee > 0 ? formatCurrency(serviceFee) : "Grátis"}
                    </span>
                  </div>

                  {appliedDiscount > 0 ? (
                    <div className="flex justify-between text-emerald-500 font-medium">
                      <span>Desconto de cupom</span>
                      <span className="">-{formatCurrency(appliedDiscount)}</span>
                    </div>
                  ) : null}

                  <div className="border-t border-border/60 pt-3 flex items-center justify-between text-base">
                    <span className="font-bold text-foreground">Total</span>
                    <span className=" text-xl font-bold text-primary">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <Button
                  type="button"
                  size="lg"
                  onClick={() => alert("Protótipo visual do carrinho. Fluxo de pagamento em breve!")}
                  className="w-full"
                >
                  Avançar para Pagamento
                </Button>

                {/* Payment Methods */}
                <div className="pt-2 space-y-2 border-t border-border/50">
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    Formas de pagamento aceitas
                  </p>
                  <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1 text-xs font-medium rounded-md bg-muted px-2 py-1">
                      <QrCodeIcon className="size-3.5 text-primary" />
                      Pix (Instantâneo)
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium rounded-md bg-muted px-2 py-1">
                      <CreditCardIcon className="size-3.5 text-primary" />
                      Cartão
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium rounded-md bg-muted px-2 py-1">
                      <WalletIcon className="size-3.5 text-primary" />
                      Saldo
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Listings Carousel */}
        <RecentListingsCarousel />
      </Container>
    </div>
  );
}
