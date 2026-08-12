"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  ClockIcon,
  MessageSquareHeartIcon,
  StarIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { HourlyReviewItem } from "../types";
import type { ListingProductType } from "@/types/api";
import { cn } from "@/lib/utils";

type Props = {
  reviews: HourlyReviewItem[];
  sellerName: string;
  ratingAvg: number;
  ratingCount: number;
  reviewsPerHour: number;
};

const CLASS_LABEL: Record<ListingProductType, string> = {
  CONTA: "Conta",
  ITEM: "Item",
  SERVICO: "Serviço",
  GOLD: "Gold / Moeda",
  OUTROS: "Outros",
};

export function SellerHourlyReviews({
  reviews,
  sellerName,
  ratingAvg,
  ratingCount,
  reviewsPerHour,
}: Props) {
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");

  const filteredReviews = reviews.filter((r) =>
    filterRating === "ALL" ? true : r.rating === filterRating,
  );

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquareHeartIcon className="size-5 text-amber-400" />
            Feed de Avaliações Recentes por Hora
          </h2>
          <p className="text-xs text-muted-foreground">
            Opiniões verificadas de compradores das últimas horas para {sellerName}.
          </p>
        </div>

        {/* Rating Overview */}
        <div className="flex items-center gap-3 bg-card/40 rounded-md p-2 border border-border/60">
          <div className="text-center px-2">
            <div className="flex items-center gap-1 text-lg font-bold text-amber-400 tabular-nums">
              <StarIcon className="size-4 fill-amber-400" />
              {ratingAvg.toFixed(1)}
            </div>
            <span className="text-[10px] text-muted-foreground">({ratingCount} total)</span>
          </div>

          <div className="h-8 w-px bg-border/60" />

          <div className="text-center px-2">
            <div className="flex items-center gap-1 text-sm font-bold text-emerald-400 tabular-nums">
              <ClockIcon className="size-3.5" />
              {reviewsPerHour} / hr
            </div>
            <span className="text-[10px] text-muted-foreground">Frequência Média</span>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
        <button
          onClick={() => setFilterRating("ALL")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold border transition-all",
            filterRating === "ALL"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground",
          )}
        >
          Todas ({reviews.length})
        </button>
        <button
          onClick={() => setFilterRating(5)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border transition-all",
            filterRating === 5
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground",
          )}
        >
          <StarIcon className="size-3 fill-amber-400 text-amber-400" />
          5 Estrelas ({reviews.filter((r) => r.rating === 5).length})
        </button>
      </div>

      {/* Reviews Hourly Timeline List */}
      <div className="space-y-3">
        {filteredReviews.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col gap-2 rounded-md border border-border/60 bg-background/40 p-3.5 transition-colors hover:border-primary/35"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {item.buyerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.buyerAvatar}
                    alt={item.buyerName}
                    className="size-8 rounded-full object-cover ring-1 ring-border/60"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {item.buyerName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {item.buyerName}
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2Icon className="size-2.5" />
                      Compra Confirmada
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {item.orderCode}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
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
                  {item.timeAgo}
                </span>
              </div>
            </div>

            <p className="text-xs text-foreground/90 leading-relaxed font-medium pl-1">
              &quot;{item.comment}&quot;
            </p>

            <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-2 text-[10px] text-muted-foreground">
              <span className="truncate max-w-[280px] sm:max-w-md">
                Item: <span className="font-semibold text-foreground/80">{item.productTitle}</span>
              </span>
              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-semibold text-foreground/70">
                {CLASS_LABEL[item.productType] || "Produto"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
