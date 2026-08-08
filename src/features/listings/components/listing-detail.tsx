import { ShieldCheckIcon, UserIcon } from "lucide-react";
import { listingVertical } from "@/features/catalog/listing-category";
import { formatBRLFromCents } from "@/lib/format";
import { BuyEscrowButton } from "@/features/orders/components/buy-escrow-button";
import type { ListingDetail as ListingDetailType } from "@/types/api";

type Props = {
  listing: ListingDetailType;
};

export function ListingDetailView({ listing }: Props) {
  const cover = listing.media[0]?.url;
  const canBuy = listing.status === "ACTIVE";
  const vertical = listingVertical(listing.category);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-10">
      <div className="space-y-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/70">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-[linear-gradient(145deg,hsl(217_40%_18%),hsl(220_30%_10%))] text-sm text-white/50">
              {vertical.name}
            </div>
          )}
          <span className="absolute top-3 left-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {vertical.name}
          </span>
        </div>
        {listing.media.length > 1 ? (
          <div className="grid grid-cols-4 gap-2">
            {listing.media.slice(0, 4).map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.url}
                alt=""
                className="aspect-square rounded-lg object-cover bg-muted ring-1 ring-border/60"
              />
            ))}
          </div>
        ) : null}

        <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-5 sm:p-6">
          <h2 className="text-sm font-medium">Descrição</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {listing.description}
          </p>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="space-y-5 rounded-2xl border border-border/70 bg-background/80 p-5 shadow-[0_20px_50px_-40px_hsl(220_40%_10%/0.45)] sm:p-6">
          <div className="space-y-2">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              {listing.category.name}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {listing.title}
            </h1>
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {listing.listingModel === "DYNAMIC" ? (
                <span className="text-lg font-medium text-muted-foreground">
                  a partir de{" "}
                </span>
              ) : null}
              {formatBRLFromCents(listing.priceCents)}
            </p>
          </div>

          {listing.listingModel === "DYNAMIC" && listing.offers?.length ? (
            <ul className="space-y-2 rounded-xl border border-border/60 p-3">
              {listing.offers.map((offer) => (
                <li
                  key={offer.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">
                    {offer.title}
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {formatBRLFromCents(offer.priceCents)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="size-4" />
            <span>{listing.seller.name ?? "Vendedor"}</span>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
            <ShieldCheckIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              Proteção por escrow — o pagamento fica bloqueado até você
              confirmar a entrega.
            </p>
          </div>

          {canBuy ? (
            <BuyEscrowButton
              listingId={listing.id}
              sellerId={listing.seller.id}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Este anúncio não está disponível para compra.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
