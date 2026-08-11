"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  answerListingQuestion,
  fetchReceivedQuestions,
  type ListingQuestion,
} from "@/features/questions/api";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { ConversationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/lib/routes";

export function ReceivedQuestionsClient() {
  const [questions, setQuestions] = useState<ListingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchReceivedQuestions();
        if (!cancelled) setQuestions(res.questions);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as perguntas.",
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

  async function onAnswer(id: string) {
    const text = (drafts[id] ?? "").trim();
    if (text.length < 2 || pendingId) return;
    setPendingId(id);
    setError(null);
    try {
      const { question } = await answerListingQuestion(id, text);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? question : q)),
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível responder.",
      );
    } finally {
      setPendingId(null);
    }
  }

  if (loading) return <ConversationsListSkeleton />;

  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma pergunta nos seus anúncios ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {questions.map((q) => (
          <li
            key={q.id}
            className="rounded-md border border-border/60 bg-card/40 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <Link
                  href={routes.listing(q.listingId)}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {q.listing?.title ?? "Anúncio"}
                </Link>
                <p className="text-[11px] text-muted-foreground">
                  {q.asker.name?.trim() || "Comprador"} ·{" "}
                  {formatRelativeTime(q.createdAt)}
                </p>
              </div>
              {!q.answer ? (
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase">
                  Pendente
                </span>
              ) : (
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                  Respondida
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{q.body}</p>
            {q.answer ? (
              <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Sua resposta
                </p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{q.answer}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={drafts[q.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [q.id]: e.target.value.slice(0, 2000),
                    }))
                  }
                  placeholder="Escreva a resposta…"
                  rows={3}
                  disabled={pendingId === q.id}
                  className="rounded-md"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    pendingId === q.id ||
                    (drafts[q.id] ?? "").trim().length < 2
                  }
                  onClick={() => void onAnswer(q.id)}
                >
                  {pendingId === q.id ? "Enviando…" : "Responder"}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
