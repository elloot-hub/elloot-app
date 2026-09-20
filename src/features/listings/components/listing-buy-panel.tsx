"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheckIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/features/favorites";
import { BuyEscrowButton } from "@/features/orders/components/buy-escrow-button";
import { OfferSelectMenu } from "@/features/listings/components/offer-select-menu";
import { useCart } from "@/features/cart";
import { useAuth } from "@/features/auth/context";
import { trackListingEvent } from "@/features/listings/track-listing-event";
import { trackMarketingEvent } from "@/features/marketing/components/marketing-scripts";
import { formatBRLFromCents } from "@/lib/format";
import type {
  ListingDetail as ListingDetailType,
  ListingOffer,
} from "@/types/api";

type Props = {
  listing: ListingDetailType;
};

export function ListingBuyPanel({ listing }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);

  const isDynamic = listing.listingModel === "DYNAMIC";
  const offers = useMemo(
    () =>
      (listing.offers ?? [])
        .slice()
        .sort(
          (a, b) => a.sortOrder - b.sortOrder || a.priceCents - b.priceCents,
        ),
    [listing.offers],
  );

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(
    () => offers[0]?.id ?? null,
  );
  const selectedOffer: ListingOffer | null =
    offers.find((o) => o.id === selectedOfferId) ?? offers[0] ?? null;
  const displayPrice = isDynamic
    ? (selectedOffer?.priceCents ?? listing.priceCents)
    : listing.priceCents;
  const canBuy =
    listing.status === "ACTIVE" &&
    (!isDynamic || Boolean(selectedOffer)) &&
    (isDynamic
      ? (selectedOffer?.stockQuantity ?? 0) > 0
      : listing.stockQuantity > 0);
  const stockLabel = isDynamic
    ? selectedOffer
      ? `${selectedOffer.stockQuantity} em estoque`
      : "Sem estoque"
    : `${listing.stockQuantity} em estoque`;

  const isOwnListing = Boolean(user && user.id === listing.seller.id);
  const emailOk = listing.seller.verifications?.email ?? false;
  const docsOk = listing.seller.verifications?.documents ?? false;

  const handleAddToCart = () => {
    if (isOwnListing || !canBuy) return;

    const itemTitle =
      isDynamic && selectedOffer
        ? `${listing.title} - ${selectedOffer.title}`
        : listing.title;

    addItem({
      listingId: listing.id,
      offerId: isDynamic ? selectedOffer?.id : undefined,
      title: itemTitle,
      priceCents: displayPrice,
      image: listing.media[0]?.url || "/elloot-navbar.png",
      category: listing.category?.name || "Marketplace",
      sellerId: listing.seller.id,
      seller: {
        name: listing.seller.name || "Vendedor",
        verified: Boolean(emailOk || docsOk),
      },
      stock: isDynamic
        ? selectedOffer?.stockQuantity
        : listing.stockQuantity,
    });
    void trackListingEvent(listing.id, "PURCHASE_INTENT", displayPrice);
    void trackMarketingEvent({
      name: "add_to_cart",
      listingId: listing.id,
      valueCents: displayPrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-md border border-border/60 bg-card/50 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-2xl font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
            {formatBRLFromCents(displayPrice)}
          </p>
        </div>
        <FavoriteButton listingId={listing.id} size="sm" />
      </div>

      {isDynamic && offers.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Escolha um item
            </p>
            <p className="text-xs text-muted-foreground">{stockLabel}</p>
          </div>
          <OfferSelectMenu
            offers={offers}
            value={selectedOffer?.id ?? null}
            onChange={setSelectedOfferId}
          />
        </div>
      ) : null}

      {canBuy ? (
        <div className="space-y-2">
          <div className="flex items-stretch gap-2">
            <BuyEscrowButton
              listingId={listing.id}
              sellerId={listing.seller.id}
              offerId={isDynamic ? selectedOffer?.id : undefined}
              priceCents={displayPrice}
              priceLabel={formatBRLFromCents(displayPrice)}
              showHint={false}
              className="min-w-0 flex-[1.4]"
              buttonClassName="h-11"
            />
            {isOwnListing ? null : (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddToCart}
                aria-label={
                  added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"
                }
                className="h-11 min-w-11 flex-1 gap-2 px-3 sm:flex-[0.9] sm:px-4"
              >
                {added ? (
                  <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
                ) : (
                  <ShoppingBagIcon className="size-4 shrink-0" />
                )}
                <span className="truncate text-sm">
                  <span className="sm:hidden">{added ? "Ok" : "Carrinho"}</span>
                  <span className="hidden sm:inline">
                    {added ? "Adicionado" : "Adicionar ao carrinho"}
                  </span>
                </span>
              </Button>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            O pagamento fica retido até a confirmação da entrega.
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-border/50 px-3 py-3 text-center text-sm text-muted-foreground">
          {listing.status !== "ACTIVE"
            ? "Este anúncio não está disponível para compra."
            : isDynamic && !selectedOffer
              ? "Nenhuma oferta disponível."
              : "Sem estoque no momento."}
        </p>
      )}

      <ul className="space-y-2.5 border-t border-border/50 pt-4 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          <span>Entrega garantida ou dinheiro de volta</span>
        </li>
        <li className="flex items-start gap-2">
          <BadgeCheckIcon className="mt-0.5 size-4 shrink-0 text-sky-400" />
          <span>
            {emailOk && docsOk
              ? "E-mail e documentos verificados"
              : emailOk
                ? "E-mail verificado"
                : docsOk
                  ? "Documentos verificados"
                  : "Compra protegida por escrow"}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CreditCardIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>Pagamento seguro via PIX</span>
        </li>
      </ul>
    </div>
  );
}
