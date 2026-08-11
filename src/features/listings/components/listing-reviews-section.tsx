"use client";

import { useCallback, useEffect, useState } from "react";
import { StarIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { fetchListingReviews, type ListingReview, type ReviewSummary, } from "@/features/reviews/api";
import { formatRelativeTime, userInitial, } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
};

const emptySummary: ReviewSummary = {
  ratingCount: 0,
  ratingAvg: null,
  stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  positiveCount: 0,
  neutralCount: 0,
  negativeCount: 0,
  positivePercent: null,
};

function starCount(summary: ReviewSummary, n: number) {
  const s = summary.stars as Record<number, number>;
  return s[n] ?? 0;
}

export function ListingReviewsSection({ listingId }: Props) {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(emptySummary);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchListingReviews(listingId, { limit: 10 });
      setReviews(res.reviews);
      setSummary(res.summary);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar as avaliações.",
      );
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchListingReviews(listingId, {
        cursor: nextCursor,
        limit: 10,
      });
      setReviews((prev) => [...prev, ...res.reviews]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  const maxBar = Math.max(
    1,
    ...[5, 4, 3, 2, 1].map((n) => starCount(summary, n)),
  );

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Avaliações</h2>
          <p className="text-sm text-muted-foreground">
            Notas de compradores neste anúncio.
          </p>
        </div>
        {summary.ratingAvg != null ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
            <StarIcon className="size-4 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">{summary.ratingAvg.toFixed(1)}</span>
            <span className="font-normal text-muted-foreground">
              ({summary.ratingCount})
            </span>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-md border border-border/50 bg-background/40 px-3 py-4">
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {summary.ratingAvg != null
                  ? summary.ratingAvg.toFixed(1)
                  : "—"}
              </p>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className={cn(
                      "size-3.5",
                      summary.ratingAvg != null && i < Math.round(summary.ratingAvg)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-md border border-border/50 bg-background/40 px-3 py-4">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Avaliações
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {summary.ratingCount}
              </p>
            </div>

            <div className="space-y-2 rounded-md border border-border/50 bg-background/40 px-3 py-3">
              <DistRow
                label="Positivas"
                count={summary.positiveCount}
                total={summary.ratingCount}
                className="bg-emerald-500"
              />
              <DistRow
                label="Neutras"
                count={summary.neutralCount}
                total={summary.ratingCount}
                className="bg-muted-foreground/50"
              />
              <DistRow
                label="Negativas"
                count={summary.negativeCount}
                total={summary.ratingCount}
                className="bg-destructive"
              />
            </div>
          </div>

          <div className="space-y-1.5 rounded-md border border-border/50 bg-background/40 p-3">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = starCount(summary, n);
              const pct = (count / maxBar) * 100;
              return (
                <div key={n} className="flex items-center gap-2 text-xs">
                  <span className="inline-flex w-8 items-center gap-0.5 tabular-nums text-muted-foreground">
                    {n}
                    <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-amber-400/90 transition-[width]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ainda não há avaliações neste anúncio.
            </p>
          ) : (
            <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
              {reviews.map((r) => (
                <li key={r.id} className="flex gap-3 px-3 py-3 sm:px-4">
                  {r.buyer.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.buyer.avatarUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border/60"
                    />
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {userInitial(r.buyer.name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-semibold">
                        {r.buyer.name?.trim() || "Comprador"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="mt-1 text-sm whitespace-pre-wrap break-words text-muted-foreground">
                        {r.comment}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        Sem comentário
                      </p>
                    )}
                  </div>
                  <Sentiment rating={r.rating} />
                </li>
              ))}
            </ul>
          )}

          {nextCursor ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function DistRow({
  label,
  count,
  total,
  className,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn("h-full rounded-full", className)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Sentiment({ rating }: { rating: number }) {
  if (rating >= 4) {
    return <ThumbsUpIcon className="size-5 shrink-0 text-emerald-400" />;
  }
  if (rating <= 2) {
    return <ThumbsDownIcon className="size-5 shrink-0 text-destructive" />;
  }
  return (
    <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
      {rating}★
    </span>
  );
}
