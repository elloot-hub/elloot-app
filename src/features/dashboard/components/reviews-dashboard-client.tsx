"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StarIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import {
  fetchMyReviews,
  fetchReceivedReviews,
  type ListingReview,
  type ReviewSummary,
} from "@/features/reviews/api";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { MetricsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Mode = "received" | "mine";

export function ReviewsDashboardClient({ mode }: { mode: Mode }) {
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (mode === "received") {
          const res = await fetchReceivedReviews();
          if (!cancelled) {
            setReviews(res.reviews);
            setSummary(res.summary);
          }
        } else {
          const res = await fetchMyReviews();
          if (!cancelled) {
            setReviews(res.reviews);
            setSummary(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as avaliações.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  if (loading) return <MetricsSkeleton />;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <div className="space-y-4">
      {summary && mode === "received" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Média"
            value={
              summary.ratingAvg != null
                ? summary.ratingAvg.toFixed(1)
                : "—"
            }
          />
          <SummaryCard
            label="Total"
            value={String(summary.ratingCount)}
          />
          <SummaryCard
            label="Positivas"
            value={
              summary.positivePercent != null
                ? `${summary.positivePercent}%`
                : "—"
            }
          />
        </div>
      ) : null}

      {reviews.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === "received"
              ? "Você ainda não recebeu avaliações."
              : "Você ainda não avaliou nenhuma compra."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex gap-3 rounded-md border border-border/60 bg-card/40 p-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={routes.listing(r.listingId)}
                    className="text-sm font-semibold hover:text-primary"
                  >
                    {r.listing?.title ?? "Anúncio"}
                  </Link>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {mode === "received"
                    ? r.buyer.name?.trim() || "Comprador"
                    : "Sua avaliação"}{" "}
                  · {formatRelativeTime(r.createdAt)}
                </p>
                {r.comment ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {r.comment}
                  </p>
                ) : null}
              </div>
              {r.rating >= 4 ? (
                <ThumbsUpIcon className="size-5 shrink-0 text-emerald-400" />
              ) : r.rating <= 2 ? (
                <ThumbsDownIcon className="size-5 shrink-0 text-destructive" />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-3.5",
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/35",
          )}
        />
      ))}
    </span>
  );
}
