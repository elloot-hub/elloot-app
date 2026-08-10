"use client";

import { useMemo, useState } from "react";
import { BadgeCheckIcon, CreditCardIcon, ShieldCheckIcon, } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";
import { FavoriteButton } from "@/features/favorites";
import { BuyEscrowButton } from "@/features/orders/components/buy-escrow-button";
import { OfferSelectMenu } from "@/features/listings/components/offer-select-menu";
import { formatBRLFromCents } from "@/lib/format";
import type { ListingDetail as ListingDetailType, ListingOffer, } from "@/types/api";

type Props = {
  listing: ListingDetailType;
};

export function ListingBuyPanel({ listing }: Props) {
  const isDynamic = listing.listingModel === "DYNAMIC";
  const isAuto = listing.deliveryMode === "AUTO";
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

  const selectedOffer: ListingOffer | null = offers.find((o) => o.id === selectedOfferId) ?? offers[0] ?? null;
  const selectedIsAuto = isDynamic ? (selectedOffer?.deliveryMode ?? listing.deliveryMode) === "AUTO" : isAuto;
  const displayPrice = isDynamic ? (selectedOffer?.priceCents ?? listing.priceCents) : listing.priceCents;
  const canBuy = listing.status === "ACTIVE" && (!isDynamic || Boolean(selectedOffer)) && (isDynamic ? (selectedOffer?.stockQuantity ?? 0) > 0 : listing.stockQuantity > 0);
  const stockLabel = isDynamic ? selectedOffer ? `${selectedOffer.stockQuantity} em estoque` : "Sem estoque" : `${listing.stockQuantity} em estoque`;

  const emailOk = listing.seller.verifications?.email ?? false;
  const docsOk = listing.seller.verifications?.documents ?? false;

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
        <BuyEscrowButton
          listingId={listing.id}
          sellerId={listing.seller.id}
          offerId={isDynamic ? selectedOffer?.id : undefined}
          priceLabel={formatBRLFromCents(displayPrice)}
        />
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
