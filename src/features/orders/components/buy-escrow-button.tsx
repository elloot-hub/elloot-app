"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOrder } from "@/features/orders/api";
import { useAuth } from "@/features/auth/context";
import { trackListingEvent } from "@/features/listings/track-listing-event";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  sellerId: string;
  offerId?: string;
  priceCents?: number;
  priceLabel?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  /** When false, hides the escrow helper line under the button. */
  showHint?: boolean;
};

export function BuyEscrowButton({
  listingId,
  sellerId,
  offerId,
  priceCents,
  priceLabel,
  disabled,
  className,
  buttonClassName,
  showHint = true,
}: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnListing = Boolean(user && user.id === sellerId);

  async function onBuy() {
    setError(null);

    if (!user) {
      router.push(
        `${routes.login}?next=${encodeURIComponent(routes.listing(listingId))}`,
      );
      return;
    }

    if (isOwnListing) {
      setError("Você não pode comprar o próprio anúncio.");
      return;
    }

    setPending(true);
    try {
      void trackListingEvent(listingId, "PURCHASE_INTENT", priceCents);
      const { order } = await createOrder(listingId, offerId);
      router.push(routes.order(order.id));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível criar o pedido.",
      );
    } finally {
      setPending(false);
    }
  }

  const label = pending
    ? "Criando…"
    : isOwnListing
      ? "Seu anúncio"
      : !user
        ? "Entrar"
        : "Comprar";

  const labelDesktop = pending
    ? "Criando pedido…"
    : isOwnListing
      ? "Seu anúncio"
      : !user
        ? "Entrar para comprar"
        : priceLabel
          ? `Comprar por ${priceLabel}`
          : "Comprar com escrow";

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        className={cn("h-11 w-full", buttonClassName)}
        disabled={disabled || loading || pending || isOwnListing}
        onClick={() => void onBuy()}
      >
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{labelDesktop}</span>
      </Button>
      {error ? (
        <p className="text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : showHint ? (
        <p className="text-center text-xs text-muted-foreground">
          O pagamento fica retido até a confirmação da entrega.
        </p>
      ) : null}
    </div>
  );
}
