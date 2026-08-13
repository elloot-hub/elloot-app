"use client";

import { ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function CartButton({ className }: Props) {
  const { itemCount, toggleCart, isOpen, ready } = useCart();
  const showBadge = ready && itemCount > 0;

  return (
    <Button
      type="button"
      onClick={toggleCart}
      aria-label={`Carrinho de compras (${ready ? itemCount : 0} itens)`}
      aria-expanded={isOpen}
      title="Carrinho de compras"
      variant="default"
      size="icon-sm"
      className={cn(
        "relative rounded-full",
        isOpen && "text-primary bg-primary/10",
        className,
      )}
    >
      <ShoppingBagIcon className="size-4" />

      {showBadge ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-background animate-in zoom-in-50 duration-200"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      ) : null}
    </Button>
  );
}
