"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  MinusIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/features/cart/context";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    serviceFee,
    total,
    clearCart,
  } = useCart();

  // Keyboard shortcut & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeCart}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Slide-over Panel (Right to Left animation) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho inicial"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md sm:max-w-lg flex-col bg-background/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-card/95 select-none",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBagIcon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Seu Carrinho
                </h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Revise seus itens antes de prosseguir
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="relative mb-4 flex size-20 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <ShoppingBagIcon className="size-9 stroke-[1.5]" />
                <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-background border border-border text-xs text-muted-foreground">
                  0
                </span>
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">
                Seu carrinho está vazio
              </h3>
              <p className="mt-1.5 max-w-xs text-xs text-muted-foreground text-balance">
                Adicione contas, skins, moedas e serviços digitais incríveis para começar suas compras.
              </p>
              <Link
                href={routes.market}
                onClick={closeCart}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "mt-6 px-6",
                )}
              >
                Explorar Anúncios
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                <span>Produtos selecionados ({items.length})</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar tudo
                </button>
              </div>

              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQty={(newQty) => updateQuantity(item.id, newQty)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 ? (
          <div className="border-t border-border/80 bg-background/80 backdrop-blur-md p-4 sm:p-5 space-y-3.5 dark:border-white/10">
            {/* Security Banner */}
            <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-xs text-primary">
              <ShieldCheckIcon className="size-4 shrink-0 text-primary" />
              <p className="line-clamp-2 text-[11px] leading-tight">
                <strong>Compra Protegida Elloot:</strong> O pagamento fica retido até você confirmar a entrega.
              </p>
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Taxa de Serviço & Escrow
                </span>
                <span className="text-foreground font-medium">
                  {serviceFee > 0 ? formatCurrency(serviceFee) : "Grátis"}
                </span>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Total</span>
                <span className=" text-lg font-bold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Redirect Actions */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  closeCart();
                  router.push(routes.cart);
                }}
                className="w-full"
              >
                Avançar para Pagamento
              </Button>

              <button
                type="button"
                onClick={closeCart}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "w-full text-xs text-muted-foreground hover:text-foreground",
                )}
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: ReturnType<typeof useCart>["items"][number];
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}) {
  const [imgSrc, setImgSrc] = useState(item.image);

  return (
    <div className="group relative flex gap-3 rounded-xl border border-border/70 bg-card/60 p-3 transition-all duration-200 hover:border-border hover:bg-card/90 hover:shadow-md dark:border-white/5 dark:bg-muted/20">
      {/* Thumbnail */}
      <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted">
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          unoptimized
          onError={() => {
            setImgSrc("/elloot-navbar.png");
          }}
          className="object-cover transition-transform duration-300 group-hover:scale-105 select-none pointer-events-none"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between gap-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              {item.category ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.category}
                </span>
              ) : null}
              <h4 className="line-clamp-2 text-xs sm:text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                {item.title}
              </h4>
            </div>

            <button
              type="button"
              onClick={onRemove}
              title="Remover produto"
              className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive p-1 rounded-md shrink-0"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>

          {item.seller ? (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Vendido por:</span>
              <span className="font-medium text-foreground">{item.seller.name}</span>
              {item.seller.verified ? (
                <CheckCircle2Icon className="size-3 text-primary shrink-0" />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Quantity & Unit Price */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-lg border border-border/70 bg-background/50 p-0.5 dark:border-white/10">
            <button
              type="button"
              onClick={() => onUpdateQty(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Diminuir quantidade"
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="w-7 text-center  text-xs font-semibold text-foreground">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.quantity + 1)}
              disabled={Boolean(item.stock && item.quantity >= item.stock)}
              aria-label="Aumentar quantidade"
              className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            >
              <PlusIcon className="size-3" />
            </button>
          </div>

          <div className="text-right">
            {item.originalPrice ? (
              <span className="block text-[10px] text-muted-foreground line-through">
                {formatCurrency(item.originalPrice * item.quantity)}
              </span>
            ) : null}
            <span className=" text-sm font-bold text-foreground">
              {formatCurrency(item.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
