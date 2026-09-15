"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  ClockIcon,
  MessageSquareHeartIcon,
  StarIcon,
} from "lucide-react";
import type { ProfileReviewItem } from "../types";
import type { ListingProductType } from "@/types/api";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { cn } from "@/lib/utils";

type Props = {
  reviews: ProfileReviewItem[];
  sellerName: string;
  ratingAvg: number;
  ratingCount: number;
  reviewsPerHour: number;
  reviewsLast24h?: number;
};

const CLASS_LABEL: Record<ListingProductType, string> = {
  CONTA: "Conta",
  ITEM: "Item",
  SERVICO: "Serviço",
  GOLD: "Gold / Moeda",
  OUTROS: "Outros",
};

export function SellerReviewsFeed({
  reviews,
  sellerName,
  ratingAvg,
  ratingCount,
  reviewsPerHour,
  reviewsLast24h = 0,
}: Props) {
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");

  const filteredReviews = reviews.filter((r) =>
    filterRating === "ALL" ? true : r.rating === filterRating,
  );

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <MessageSquareHeartIcon className="size-5 text-amber-500" />
            Avaliações recentes
          </h2>
          <p className="text-xs text-muted-foreground">
            Opiniões de compradores verificados sobre {sellerName}.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 p-2">
          <div className="px-2 text-center">
            <div className="flex items-center gap-1 text-lg font-bold text-amber-500 tabular-nums">
              <StarIcon className="size-4 fill-amber-400 text-amber-400" />
              {ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              ({ratingCount} total)
            </span>
          </div>

          <div className="h-8 w-px bg-border/60" />

          <div className="px-2 text-center">
            <div className="flex items-center gap-1 text-sm font-bold text-foreground tabular-nums">
              <ClockIcon className="size-3.5 text-muted-foreground" />
              {reviewsLast24h}
            </div>
            <span className="text-[10px] text-muted-foreground">
              nas últimas 24h
              {reviewsPerHour > 0 ? ` · ${reviewsPerHour}/h` : ""}
            </span>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFilterRating("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filterRating === "ALL"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
            )}
          >
            Todas ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRating(5)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filterRating === 5
                ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <StarIcon className="size-3 fill-amber-400 text-amber-400" />
            5 estrelas ({reviews.filter((r) => r.rating === 5).length})
          </button>
        </div>
      ) : null}

      {filteredReviews.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Nenhuma avaliação ainda
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            As avaliações de compras concluídas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((item) => {
            const buyerLabel = item.buyerName?.trim() || "Comprador";
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/40 p-3.5 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {item.buyerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.buyerAvatar}
                        alt=""
                        className="size-8 rounded-full object-cover ring-1 ring-border/60"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {buyerLabel.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">
                          {buyerLabel}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2Icon className="size-2.5" />
                          Compra confirmada
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {item.orderCode}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <StarIcon
                          key={i}
                          className={cn(
                            "size-3",
                            i < item.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted/40",
                          )}
                        />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ClockIcon className="size-2.5" />
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>

                {item.comment?.trim() ? (
                  <p className="pl-1 text-xs leading-relaxed text-foreground/90">
                    &quot;{item.comment.trim()}&quot;
                  </p>
                ) : null}

                <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
                  <span className="max-w-[280px] truncate sm:max-w-md">
                    Item:{" "}
                    <span className="font-semibold text-foreground/80">
                      {item.productTitle}
                    </span>
                  </span>
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 font-semibold text-foreground/70">
                    {CLASS_LABEL[item.productType] || "Produto"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/** @deprecated Prefer SellerReviewsFeed */
export const SellerHourlyReviews = SellerReviewsFeed;
