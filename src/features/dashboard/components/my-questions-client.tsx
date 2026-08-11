"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchMyQuestions,
  type ListingQuestion,
} from "@/features/questions/api";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { ConversationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";

export function MyQuestionsClient() {
  const [questions, setQuestions] = useState<ListingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchMyQuestions();
        if (!cancelled) setQuestions(res.questions);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar suas perguntas.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <ConversationsListSkeleton />;
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Você ainda não fez perguntas em anúncios.
        </p>
        <Link
          href={routes.market}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Explorar mercado
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {questions.map((q) => (
        <li
          key={q.id}
          className="rounded-md border border-border/60 bg-card/40 p-4 space-y-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Link
              href={routes.listing(q.listingId)}
              className="text-sm font-semibold hover:text-primary"
            >
              {q.listing?.title ?? "Anúncio"}
            </Link>
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(q.createdAt)}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{q.body}</p>
          {q.answer ? (
            <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
              <p className="text-[11px] font-medium text-primary">
                Resposta do vendedor
              </p>
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                {q.answer}
              </p>
            </div>
          ) : (
            <p className="text-xs text-amber-400">Aguardando resposta</p>
          )}
        </li>
      ))}
    </ul>
  );
}
