"use client";

import Link from "next/link";
import { useState } from "react";

import type { ListingDetail, ListingStatus } from "@/types/api";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";

import { pauseListing, unpauseListing } from "@/features/listings/api";
import { listingVertical } from "@/features/catalog/listing-category";

import { formatBRLFromCents } from "@/lib/format";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<ListingStatus, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
  DRAFT: {
    label: "Rascunho",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
    bgClass: "bg-white",
  },
  PENDING_REVIEW: {
    label: "Em análise",
    dotClass: "bg-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500",
  },
  ACTIVE: {
    label: "Publicado",
    dotClass: "bg-white",
    textClass: "text-white",
    bgClass: "bg-emerald-500",
  },
  PAUSED: {
    label: "Pausado",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
    bgClass: "bg-white",
  },
  SOLD: {
    label: "Esgotado",
    dotClass: "bg-orange-500",
    textClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500",
  },
  REJECTED: {
    label: "Rejeitado",
    dotClass: "bg-destructive",
    textClass: "text-destructive",
    bgClass: "bg-destructive",
  },
  REMOVED: {
    label: "Removido",
    dotClass: "bg-muted-foreground",
    textClass: "text-muted-foreground",
    bgClass: "bg-white",
  },
};

type ListingDashboardCardProps = {
  listing: ListingDetail;
  metrics?: {
    uniqueVisits: number;
    conversionPercent: number;
    sales: number;
  };
  onUpdated: (listing: ListingDetail) => void;
};

function stockLabel(listing: ListingDetail) {
  if (listing.listingModel === "DYNAMIC") {
    const count = listing.offers?.length ?? 0;
    return count === 1 ? "1 variante" : `${count} variantes`;
  }
  return `${listing.stockQuantity} un.`;
}

export function ListingDashboardCard({
  listing,
  metrics,
  onUpdated,
}: ListingDashboardCardProps) {
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const cover = listing.media[0]?.url;
  const vertical = listingVertical(listing.category);
  const status = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.DRAFT;
  const canEdit = listing.status !== "SOLD" && listing.status !== "REMOVED";
  const canToggle = listing.status === "ACTIVE" || listing.status === "PAUSED";
  const isActive = listing.status === "ACTIVE";

  async function handleToggle(next: boolean) {
    if (!canToggle || toggling) return;
    setToggling(true);
    setToggleError(null);
    try {
      const { listing: updated } = next
        ? await unpauseListing(listing.id)
        : await pauseListing(listing.id);
      onUpdated(updated);
    } catch (err) {
      setToggleError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setToggling(false);
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border/60 bg-card/50">
      <div className="relative aspect-[12/6] w-full bg-muted">
        {cover ? (
          <img
            src={cover}
            alt=""
            className="size-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="absolute select-none top-2 left-2 z-[1] flex items-center gap-1">
          <div className={cn("inline-flex items-center rounded-sm px-1.5 py-0.5 gap-1.5 text-xs font-medium", status.bgClass, status.textClass)}>
            <span className={cn("size-2 rounded-full", status.dotClass)} />
            {status.label}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {listing.title}
          </h3>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Categoria</dt>
            <dd className="truncate font-medium">{vertical.name}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Preço inicial</dt>
            <dd className="font-semibold text-primary tabular-nums">
              {formatBRLFromCents(listing.priceCents)}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Estoque</dt>
            <dd className="font-medium tabular-nums">{stockLabel(listing)}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Vendidos</dt>
            <dd className="font-medium tabular-nums">
              {metrics?.sales ?? listing.salesCount ?? 0}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Visitas (30d)</dt>
            <dd className="font-medium tabular-nums">
              {metrics?.uniqueVisits ?? 0}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-muted-foreground">Conversão (30d)</dt>
            <dd className="font-medium tabular-nums">
              {metrics ? `${metrics.conversionPercent}%` : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-auto space-y-3 border-t border-border/50 pt-4">
          <div className="flex flex-row items-center justify-between gap-2">
            <Link
              href={routes.listing(listing.id)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex-1 sm:flex-none",
              )}
            >
              <ExternalLinkIcon className="size-3.5" />
              Ver anúncio
            </Link>

            {canEdit ? (
              <Link
                href={routes.dashboardListingEdit(listing.id)}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "flex-1 sm:flex-none",
                )}
              >
                <PencilIcon className="size-3.5" />
                Editar
              </Link>
            ) : null}

            <Toggle
              pressed={isActive}
              onPressedChange={(checked) => void handleToggle(checked)}
              disabled={!canToggle || toggling}
              className={cn(buttonVariants({ size: "sm" }), isActive ? "bg-destructive" : "bg-primary/10 hover:bg-primary/20", "rounded-sm cursor-pointer")}
              aria-label={isActive ? "Desativar anúncio" : "Ativar anúncio"}
            >
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm leading-snug">
                  <span
                    className={cn(
                      "font-medium",
                      isActive ? "text-muted-foreground" : "text-primary",
                    )}
                  >
                    {isActive ? "Pausar" : "Publicar"}
                  </span>
                </span>
              </span>
            </Toggle>
          </div>
        </div>
      </div>
    </article>
  );
};