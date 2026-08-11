"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "lucide-react";
import { createReview } from "@/features/reviews/api";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  orderId: string;
  alreadyReviewed?: boolean;
  onSubmitted?: () => void;
};

export function OrderReviewForm({
  orderId,
  alreadyReviewed,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(Boolean(alreadyReviewed));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (alreadyReviewed) setDone(true);
  }, [alreadyReviewed]);

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
        Obrigado! Sua avaliação foi registrada.
      </div>
    );
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        void (async () => {
          setPending(true);
          setError(null);
          try {
            await createReview({
              orderId,
              rating,
              comment: comment.trim() || undefined,
            });
            setDone(true);
            onSubmitted?.();
          } catch (err) {
            setError(
              err instanceof ApiError
                ? err.message
                : "Não foi possível enviar a avaliação.",
            );
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div>
        <p className="text-sm font-medium">Avaliar esta compra</p>
        <p className="text-xs text-muted-foreground">
          Sua nota ajuda outros compradores e a reputação do vendedor.
        </p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-md p-1 transition-colors hover:bg-muted/40"
              aria-label={`${value} estrela${value === 1 ? "" : "s"}`}
            >
              <StarIcon
                className={cn(
                  "size-6",
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40",
                )}
              />
            </button>
          );
        })}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 1000))}
        placeholder="Comentário opcional…"
        rows={3}
        disabled={pending}
        className="rounded-xl"
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full rounded-xl" disabled={pending}>
        {pending ? "Enviando…" : "Enviar avaliação"}
      </Button>
    </form>
  );
}
