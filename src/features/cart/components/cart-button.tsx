"use client";

import { ShoppingBagIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/features/cart/context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CartButton({ className }: Props) {
  const { itemCount, toggleCart, isOpen } = useCart();

  return (
    <Button
      type="button"
      onClick={toggleCart}
      aria-label={`Carrinho de compras (${itemCount} itens)`}
      aria-expanded={isOpen}
      title="Carrinho de compras"
      className={cn(
        buttonVariants({ variant: "default", size: "icon-sm" }),
        "relative select-none",
        isOpen && "border-primary text-primary bg-primary/10",
        className,
      )}
    >
      <ShoppingBagIcon className="size-4 transition-transform" />

      {itemCount > 0 ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-foreground shadow-md ring-2 ring-background animate-in zoom-in-50 duration-200"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Button>
  );
}
