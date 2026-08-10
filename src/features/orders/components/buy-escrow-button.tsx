"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createOrder } from "@/features/orders/api";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

type Props = {
  listingId: string;
  sellerId: string;
  offerId?: string;
  priceLabel?: string;
  disabled?: boolean;
};

export function BuyEscrowButton({ listingId, sellerId, offerId, priceLabel, disabled, }: Props) {
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

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="h-11 w-full rounded-xl"
        disabled={disabled || loading || pending || isOwnListing}
        onClick={() => void onBuy()}
      >
        {pending
          ? "Criando pedido…"
          : isOwnListing
            ? "Seu anúncio"
            : user
              ? priceLabel
                ? `Comprar por ${priceLabel}`
                : "Comprar com escrow"
              : "Entrar para comprar"}
      </Button>
      {error ? (
        <p className="text-center text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          O pagamento fica retido até a confirmação da entrega.
        </p>
      )}
    </div>
  );
}
