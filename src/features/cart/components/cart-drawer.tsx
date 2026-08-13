"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/features/cart/context";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const router = useRouter();
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotalCents,
    clearCart,
  } = useCart();

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
      <div
        aria-hidden
        onClick={closeCart}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md sm:max-w-lg flex-col bg-card border-l border-border/80 shadow-2xl transition-transform duration-300 ease-out dark:border-white/10",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Seu Carrinho
              </h2>
              {itemCount > 0 ? (
                <Badge variant="default">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Revise seus itens antes de prosseguir
            </p>
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="flex size-8 items-center justify-center cursor-pointer rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <ShoppingBagIcon className="size-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Seu carrinho está vazio
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground text-balance">
                Explore o marketplace e adicione anúncios para comprar.
              </p>
              <Link
                href={routes.market}
                onClick={closeCart}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "mt-6 px-6",
                )}
              >
                Explorar anúncios
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={clearCart}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Limpar tudo
                </Button>
              </div>

              {items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeItem(item.id)}
                  onUpdateQty={(newQty) => updateQuantity(item.id, newQty)}
                  onNavigate={closeCart}
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-border/80 bg-background/80 p-4 sm:p-5 space-y-3.5 dark:border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Subtotal</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {formatBRLFromCents(subtotalCents)}
              </span>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={() => {
                closeCart();
                router.push(routes.cart);
              }}
              className="w-full"
            >
              Ver carrinho
            </Button>
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
  onNavigate,
}: {
  item: ReturnType<typeof useCart>["items"][number];
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
  onNavigate: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(item.image);

  return (
    <div className="flex gap-3 rounded-md border border-border/70 bg-card/60 p-3 dark:border-white/5 dark:bg-muted/20">
      <Link
        href={routes.listing(item.listingId)}
        onClick={onNavigate}
        className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-muted"
      >
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          unoptimized
          onError={() => {
            setImgSrc("/elloot-navbar.png");
          }}
          className="object-cover pointer-events-none"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={routes.listing(item.listingId)}
            onClick={onNavigate}
            className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
          >
            {item.title}
          </Link>
          <Button
            type="button"
            onClick={onRemove}
            variant="ghost"
            size="icon-xs"
            aria-label="Remover item"
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center rounded-sm border border-border/70 bg-background/50 p-0.5 dark:border-white/10">
            <button
              type="button"
              onClick={() => onUpdateQty(item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Diminuir quantidade"
              className="flex size-6 items-center cursor-pointer justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              <MinusIcon className="size-3" />
            </button>
            <span className="w-7 text-center text-xs font-semibold text-foreground">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.quantity + 1)}
              disabled={Boolean(item.stock && item.quantity >= item.stock)}
              aria-label="Aumentar quantidade"
              className="flex size-6 items-center cursor-pointer justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              <PlusIcon className="size-3" />
            </button>
          </div>

          <span className="text-sm font-bold text-foreground tabular-nums">
            {formatBRLFromCents(item.priceCents * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
