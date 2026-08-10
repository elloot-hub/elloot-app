"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { ImagesIcon, LayersIcon } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { listingVertical } from "@/features/catalog/listing-category";
import { FavoriteButton } from "@/features/favorites";
import type { ListingSummary } from "@/types/api";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  listing: ListingSummary;
  priority?: boolean;
};

function sellerInitial(name: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function StatusTip({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={120}
        render={<span />}
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full outline-none",
          className,
        )}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[14rem] text-center">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function MediaCollage({
  urls,
  fallback,
}: {
  urls: string[];
  fallback: { gradient: string; label: string };
}) {
  if (urls.length === 0) {
    return (
      <div
        className="flex size-full items-center justify-center"
        style={{ background: fallback.gradient }}
      >
        <span className="px-4 text-center text-sm font-medium text-white/75">
          {fallback.label}
        </span>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={urls[0]}
        alt=""
        className="size-full object-cover select-none pointer-events-none"
      />
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid size-full grid-cols-2 gap-px bg-border/40">
        {urls.slice(0, 2).map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            className="size-full object-cover select-none pointer-events-none"
          />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-border/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[0]}
          alt=""
          className="row-span-2 size-full object-cover select-none pointer-events-none"
        />
        {urls.slice(1, 3).map((url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            className="size-full object-cover select-none pointer-events-none"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid size-full grid-cols-2 grid-rows-2 gap-px bg-border/40">
      {urls.slice(0, 4).map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt=""
          className="size-full object-cover select-none pointer-events-none"
        />
      ))}
    </div>
  );
}

export function ListingCard({ listing }: Props) {
  const urls = listing.media.map((m) => m.url).filter(Boolean);
  const mediaCount = listing.mediaCount ?? urls.length;
  const vertical = listingVertical(listing.category);
  const visual = getCategoryVisual(vertical.slug);
  const sellerName = listing.seller.name?.trim() || "Vendedor";
  const isDynamic = listing.listingModel === "DYNAMIC";
  const isAuto = listing.deliveryMode === "AUTO";

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-border/60",
        "bg-card/50 shadow-sm transition-all duration-300",
        "hover:border-primary/45 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <div className="absolute top-2 right-2 z-[2]">
        <FavoriteButton listingId={listing.id} size="sm" />
      </div>

      <Link href={routes.listing(listing.id)} className="flex flex-1 flex-col">
        <div className="relative aspect-[18/10] overflow-hidden bg-muted/30">
          <MediaCollage
            urls={urls}
            fallback={{ gradient: visual.gradient, label: vertical.name }}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

          <div className="absolute top-2 left-2 z-[1] flex items-center gap-1">
            {isAuto ? (
              <StatusTip
                label="Entrega automática"
                className="h-auto w-auto gap-1 rounded-sm bg-emerald-500/95 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              >
                <FaTruckFast className="size-3" />
                Entrega automática
              </StatusTip>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-3">
          <div className="flex items-start gap-2">
            <h2 className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug tracking-tight text-balance uppercase">
              {listing.title}
            </h2>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold tracking-tight text-primary tabular-nums">
              {formatBRLFromCents(listing.priceCents)}
              {isDynamic ? (
                <span className="ml-0.5 text-sm font-semibold text-primary/70">
                  +
                </span>
              ) : null}
            </p>

            <div className="flex shrink-0 items-center gap-1">
              {isAuto ? (
                <StatusTip
                  label="Entrega automática"
                  className="bg-emerald-500/15 text-emerald-400"
                >
                  <FaTruckFast className="size-3.5" />
                </StatusTip>
              ) : null}

              {isDynamic ? (
                <StatusTip
                  label="Anúncio dinâmico — várias ofertas no mesmo anúncio"
                  className="bg-violet-500/15 text-violet-400"
                >
                  <LayersIcon className="size-3.5" />
                </StatusTip>
              ) : null}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary"
                aria-hidden
              >
                {sellerInitial(listing.seller.name)}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {sellerName}
              </span>
            </div>
            <span className="shrink-0 truncate text-[10px] font-medium text-muted-foreground/80">
              {vertical.name}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
