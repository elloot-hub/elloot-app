import Link from "next/link";
import { ShieldCheckIcon } from "lucide-react";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { listingVertical } from "@/features/catalog/listing-category";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import type { ListingSummary } from "@/types/api";

type Props = {
  listing: ListingSummary;
  priority?: boolean;
};

export function ListingCard({ listing }: Props) {
  const cover = listing.media[0]?.url;
  const vertical = listingVertical(listing.category);
  const visual = getCategoryVisual(vertical.slug);

  return (
    <Link
      href={routes.listing(listing.id)}
      className="group flex flex-col outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-border/60 transition-[box-shadow,ring-color] duration-300 group-hover:ring-primary/40 group-hover:shadow-[0_18px_40px_-24px_hsl(217_91%_50%/0.55)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{ background: visual.gradient }}
          >
            <span className="px-4 text-center text-sm font-medium text-white/70">
              {vertical.name}
            </span>
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 rounded-lg bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {vertical.name}
        </span>
        <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-lg bg-black/55 px-1.5 py-0.5 text-[10px] text-emerald-300 backdrop-blur-sm">
          <ShieldCheckIcon className="size-3" />
          Escrow
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-0.5 pt-3.5">
        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
          {listing.category.name}
        </p>
        <h2 className="line-clamp-2 font-heading text-sm font-medium tracking-tight text-balance transition-colors group-hover:text-primary">
          {listing.title}
        </h2>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
          <p className="font-heading text-base font-semibold tabular-nums tracking-tight">
            {formatBRLFromCents(listing.priceCents)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {listing.seller.name ?? "Vendedor"}
          </p>
        </div>
      </div>
    </Link>
  );
}
