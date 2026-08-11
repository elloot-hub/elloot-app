"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MessageCircleIcon, SendIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { askListingQuestion, fetchListingQuestions, type ListingQuestion, } from "@/features/questions/api";
import { formatRelativeTime, userInitial, } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  sellerId: string;
};

export function ListingQuestionsSection({ listingId, sellerId }: Props) {
  const { user, token } = useAuth();
  const [questions, setQuestions] = useState<ListingQuestion[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchListingQuestions(listingId, { limit: 10 });
      setQuestions(res.questions);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar as perguntas.",
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
      const res = await fetchListingQuestions(listingId, {
        cursor: nextCursor,
        limit: 10,
      });
      setQuestions((prev) => [...prev, ...res.questions]);
      setNextCursor(res.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  };

  async function onAsk(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (text.length < 5 || sending) return;
    if (!token) {
      setError("Entre na sua conta para perguntar.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const { question } = await askListingQuestion(listingId, text);
      setQuestions((prev) => [question, ...prev]);
      setDraft("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar a pergunta.",
      );
    } finally {
      setSending(false);
    }
  };

  const isOwner = Boolean(user && user.id === sellerId);

  return (
    <section className="space-y-4 rounded-md border border-border/60 bg-card/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Perguntas</h2>
          <p className="text-sm text-muted-foreground">
            Tire dúvidas com o vendedor antes de comprar.
          </p>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {questions.length}
          {nextCursor ? "+" : ""} pergunta
          {questions.length === 1 && !nextCursor ? "" : "s"}
        </p>
      </div>

      {!isOwner ? (
        <form
          onSubmit={(e) => void onAsk(e)}
          className="space-y-3 rounded-md border border-border/50 bg-background/50 p-3 sm:p-4"
        >
          <p className="text-sm font-medium">Faça uma pergunta <span className="text-xs text-muted-foreground">( Atenção: não envie contatos externos "WhatsApp, Discord, e-mail, etc").</span></p>
          {token ? (
            <>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                placeholder="Escreva sua pergunta ao vendedor…"
                rows={3}
                disabled={sending}
                className="rounded-md h-24 max-h-48"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || draft.trim().length < 5}
                  className="gap-1.5"
                >
                  <SendIcon className="size-3.5" />
                  {sending ? "Enviando…" : "Perguntar"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              <Link href={routes.login} className="font-medium text-primary hover:underline">
                Entre na conta
              </Link>{" "}
              para perguntar ao vendedor.
            </p>
          )}
        </form>
      ) : (
        <p className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Você é o vendedor deste anúncio. Responda perguntas em{" "}
          <Link
            href={routes.dashboardQuestionsReceived}
            className="font-medium text-primary hover:underline"
          >
            Perguntas recebidas
          </Link>
          .
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-md border border-border/50 p-3"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageCircleIcon className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Nenhuma pergunta ainda. Seja o primeiro a perguntar!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="rounded-md border border-border/50 bg-background/40 p-3 sm:p-4"
            >
              <div className="flex gap-3">
                <Avatar name={q.asker.name} url={q.asker.avatarUrl} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-primary">
                      {q.asker.name?.trim() || "Usuário"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(q.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {q.body}
                  </p>
                </div>
              </div>
              {q.answer ? (
                <div className="mt-3 ml-0 rounded-md border border-border/40 bg-muted/30 p-3 sm:ml-12">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-primary">
                      {q.answeredBy?.name?.trim() || "Vendedor"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {q.answeredAt
                        ? formatRelativeTime(q.answeredAt)
                        : "resposta"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words text-muted-foreground">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <p className="mt-2 ml-0 text-[11px] text-muted-foreground sm:ml-12">
                  Aguardando resposta do vendedor
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {nextCursor ? (
        <div className="flex justify-center pt-1">
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
    </section>
  );
}

function Avatar({ name, url, }: { name: string | null; url?: string | null; }) {
  return url ? (
    <img
      src={url}
      alt=""
      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border/60"
    />
  ) : (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary",
      )}
    >
      {userInitial(name)}
    </span>
  );
};