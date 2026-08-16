"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, } from "react";
import { ArrowDownIcon, ArrowLeftIcon, CheckIcon, CopyIcon, ReplyIcon, SendIcon, ShieldAlertIcon, XIcon, } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { fetchConversation, fetchConversationMessages, sendConversationMessage, type ConversationMessage, type ConversationSummary, } from "@/features/conversations";
import { decodeMessageBody, encodeReplyBody, previewMessageBody, type ReplyMeta, } from "@/features/conversations/message-reply";
import { fetchOrder } from "@/features/orders/api";
import { orderStatusLabel } from "@/features/orders/labels";
import type { Order } from "@/features/orders/types";
import { ReportProblemDialog } from "@/features/disputes/components/report-problem-dialog";
import { usePresence, useRealtime } from "@/features/realtime";
import type { RealtimeMessageEvent } from "@/features/realtime/events";
import { ConversationThreadSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { playNotifySound } from "@/features/notifications/notify-sound";
import { userInitial } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const CLOSED = new Set(["COMPLETED", "REFUNDED", "CANCELLED", "EXPIRED"]);
const DISPUTE_OPEN = new Set(["PAID", "DELIVERED"]);

function newClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

function formatMsgTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

function mergeMessages(prev: ConversationMessage[], incoming: ConversationMessage[],) {
  if (incoming.length === 0) return prev;
  const byId = new Map(prev.map((m) => [m.id, m]));
  for (const msg of incoming) {
    byId.set(msg.id, msg);
    if (msg.clientId) {
      for (const [id, existing] of byId) {
        if (
          existing.clientId === msg.clientId &&
          existing.id !== msg.id &&
          existing.id.startsWith("optimistic:")
        ) {
          byId.delete(id);
        }
      }
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

function PartyAvatar({ name, url, size = "md", online, }: { name: string | null; url?: string | null; size?: "sm" | "md"; online?: boolean; }) {
  const dim = size === "sm" ? "size-7" : "size-11";
  return (
    <span className="relative shrink-0">
      <span
        className={cn(
          "flex overflow-hidden rounded-full border border-border/60 bg-muted",
          dim,
        )}
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="size-full object-cover select-none pointer-events-none"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
            {userInitial(name)}
          </span>
        )}
      </span>
      {typeof online === "boolean" ? (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-card animate-pulse",
            online ? "bg-emerald-400" : "bg-muted-foreground/50",
          )}
        />
      ) : null}
    </span>
  );
};

type Props = {
  conversationId: string;
};

export function ConversationThreadClient({ conversationId }: Props) {
  const { user } = useAuth();
  const { socket, connected } = useRealtime();
  const [conversation, setConversation] = useState<ConversationSummary | null>(null,);
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ReplyMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const otherId = conversation && user ? user.id === conversation.order.buyerId ? conversation.order.sellerId : conversation.order.buyerId : null;
  const otherPresence = usePresence(otherId);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (!el) return;
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const loadInitial = useCallback(async () => {
    const [convRes, msgRes] = await Promise.all([fetchConversation(conversationId), fetchConversationMessages(conversationId, { limit: 100 })]);
    setConversation(convRes.conversation);
    setMessages(msgRes.messages);
    try {
      const { order: nextOrder } = await fetchOrder(
        convRes.conversation.orderId,
      );
      setOrder(nextOrder);
    } catch {
      setOrder(null);
    }
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadInitial();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível abrir a conversa.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInitial]);

  useEffect(() => {
    if (loading) return;
    const id = window.requestAnimationFrame(() => {
      if (stickToBottom.current) scrollToBottom(false);
    });
    return () => window.cancelAnimationFrame(id);
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("conversation:join", { conversationId }, (ack) => {
      if (ack && !ack.ok) {
        setError((prev) => prev ?? "Não foi possível entrar no chat ao vivo.");
      }
    });

    function onMessage(payload: RealtimeMessageEvent) {
      if (payload.conversationId !== conversationId) return;
      if (stickToBottom.current) {
        setShowJump(false);
      }
      setMessages((prev) => mergeMessages(prev, [payload.message]));
      if (user?.id && payload.message.senderId !== user.id) {
        playNotifySound();
      }
    }

    socket.on("message:new", onMessage);

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", onMessage);
    };
  }, [socket, connected, conversationId, user?.id]);

  const byId = useMemo(() => {
    const map = new Map(messages.map((m) => [m.id, m]));
    return map;
  }, [messages]);

  function startReply(msg: ConversationMessage) {
    const decoded = decodeMessageBody(msg.body);
    setReplyTo({
      id: msg.id,
      name: msg.sender?.name?.trim() || "Usuário",
      snippet: decoded.body,
    });
    inputRef.current?.focus();
  };

  async function copyMessage(msg: ConversationMessage) {
    const text = decodeMessageBody(msg.body).body;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msg.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError("Não foi possível copiar a mensagem.");
    }
  };

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !user) return;

    const payload = replyTo ? encodeReplyBody(replyTo, text) : text;
    const clientId = newClientId();
    const optimistic: ConversationMessage = {
      id: `optimistic:${clientId}`,
      conversationId,
      senderId: user.id,
      body: payload,
      clientId,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name },
    };

    setDraft("");
    setReplyTo(null);
    setSending(true);
    setError(null);
    stickToBottom.current = true;
    setShowJump(false);
    setMessages((prev) => mergeMessages(prev, [optimistic]));

    try {
      if (socket?.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "message:send",
            { conversationId, body: payload, clientId },
            (ack) => {
              if (!ack?.ok || !ack.message) {
                reject(new Error(ack?.error ?? "SEND_FAILED"));
                return;
              }
              setMessages((prev) => mergeMessages(prev, [ack.message!]));
              resolve();
            },
          );
        });
      } else {
        const { message } = await sendConversationMessage(
          conversationId,
          payload,
          { clientId },
        );
        setMessages((prev) => mergeMessages(prev, [message]));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      setReplyTo(replyTo);
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Não foi possível enviar.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <ConversationThreadSkeleton />;
  };

  if (!conversation) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          {error ?? "Conversa não encontrada."}
        </p>
        <Link
          href={routes.dashboardMessages}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Voltar às mensagens
        </Link>
      </div>
    );
  };

  const isBuyer = user?.id === conversation.order.buyerId;
  const other = isBuyer ? conversation.order.seller : conversation.order.buyer;
  const otherRole = isBuyer ? "Vendedor" : "Comprador";
  const closed = CLOSED.has(conversation.order.status);
  const canOpenDispute = Boolean(user) && DISPUTE_OPEN.has(order?.status ?? conversation.order.status);
  const listingCover = conversation.order.listing.media?.[0]?.url;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border/60 bg-card/30">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={routes.dashboardMessages}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Voltar às mensagens"
          >
            <ArrowLeftIcon className="size-4" />
          </Link>
          <PartyAvatar
            name={other.name}
            url={other.avatarUrl}
            online={otherPresence.online}
          />
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-row items-center gap-2">
              <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {other.name?.trim() || otherRole}
              </h2>
              <Badge variant="default">
                {otherRole}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBRLFromCents(conversation.order.amountCents)} ·{" "}
              {orderStatusLabel(conversation.order.status)}
              {!connected ? (
                <span className="text-amber-400"> · reconectando…</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {canOpenDispute || order?.dispute ? (
            <div className="flex flex-col items-center gap-0.5">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setReportOpen(true)}
              >
                <ShieldAlertIcon className="size-3.5" />
                Relatar problema
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          className="absolute inset-0 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-4"
          onScroll={(e) => {
            const el = e.currentTarget;
            const atBottom =
              el.scrollHeight - el.scrollTop - el.clientHeight < 80;
            stickToBottom.current = atBottom;
            setShowJump(!atBottom);
          }}
        >
          <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/10 px-3 py-2.5">
            {listingCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listingCover}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover select-none pointer-events-none"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                Elloot
              </div>
            )}
            <p className="text-xs text-pretty text-muted-foreground">
              <span className="font-medium text-foreground">Sistema · </span>
              Chat protegido pela Elloot. Combine a entrega aqui — não compartilhe
              dados fora da plataforma.
            </p>
          </div>

          {conversation.order.status === "DISPUTED" || order?.dispute ? (
            <div className="rounded-md border border-orange-500/25 bg-orange-500/10 px-3 py-2.5 text-xs text-orange-200">
              <span className="font-medium">Sistema · </span>
              Disputa aberta. O escrow permanece retido até a mediação.
            </div>
          ) : null}

          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Digite abaixo para iniciar.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = user?.id === msg.senderId;
              const optimistic = msg.id.startsWith("optimistic:");
              const decoded = decodeMessageBody(msg.body);
              const quoted = decoded.reply
                ? byId.get(decoded.reply.id)
                : undefined;
              const quoteName =
                decoded.reply?.name ||
                quoted?.sender?.name?.trim() ||
                "Mensagem";
              const quoteSnippet =
                decoded.reply?.snippet ||
                (quoted ? previewMessageBody(quoted.body) : "Mensagem original");

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}
                >
                  {!mine ? (
                    <PartyAvatar
                      name={msg.sender?.name ?? other.name}
                      url={msg.sender?.avatarUrl ?? other.avatarUrl}
                      size="sm"
                    />
                  ) : null}
                  <div
                    className={cn(
                      "group/msg max-w-[min(100%,28rem)] min-w-0",
                      mine && "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-md px-3 py-2 text-sm",
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "border border-border/60 bg-muted/40 text-foreground",
                        optimistic && "opacity-70",
                      )}
                    >
                      {!mine ? (
                        <p className="mb-0.5 text-[11px] font-medium opacity-70">
                          {msg.sender?.name?.trim() || otherRole}
                        </p>
                      ) : null}
                      {decoded.reply ? (
                        <button
                          type="button"
                          className={cn(
                            "mb-2 w-full rounded-md border-l-2 px-2 py-1 text-left text-[11px]",
                            mine
                              ? "border-primary-foreground/70 bg-black/15"
                              : "border-primary bg-background/40",
                          )}
                          onClick={() => {
                            document
                              .getElementById(`msg-${decoded.reply!.id}`)
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                              });
                          }}
                        >
                          <p className="font-medium">{quoteName}</p>
                          <p className="line-clamp-2 opacity-80">{quoteSnippet}</p>
                        </button>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words">
                        {decoded.body}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[10px] tabular-nums",
                          mine ? "opacity-80" : "text-muted-foreground",
                        )}
                      >
                        {formatMsgTime(msg.createdAt)}
                        {optimistic ? " · enviando" : null}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "mt-1 flex gap-1 opacity-0 transition-opacity group-hover/msg:opacity-100 group-focus-within/msg:opacity-100",
                        mine ? "justify-end" : "justify-start",
                      )}
                    >
                      {!closed ? (
                        <button
                          type="button"
                          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => startReply(msg)}
                        >
                          <ReplyIcon className="size-3" />
                          Responder
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => void copyMessage(msg)}
                      >
                        {copiedId === msg.id ? (
                          <CheckIcon className="size-3" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                        {copiedId === msg.id ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showJump ? (
          <button
            type="button"
            className="absolute right-4 bottom-3 z-10 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-md backdrop-blur hover:bg-muted"
            aria-label="Ir para o final"
            onClick={() => {
              stickToBottom.current = true;
              setShowJump(false);
              scrollToBottom(true);
            }}
          >
            <ArrowDownIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {closed ? (
        <p className="shrink-0 border-t border-border/60 px-3 py-3 text-center text-xs text-muted-foreground sm:px-4">
          Esta conversa está encerrada para novos envios (pedido{" "}
          {orderStatusLabel(conversation.order.status).toLowerCase()}).
        </p>
      ) : (
        <form
          onSubmit={(e) => void handleSend(e)}
          className="shrink-0 border-t border-border/60"
        >
          {replyTo ? (
            <div className="flex items-start gap-2 border-b border-primary/20 bg-primary/10 px-3 py-2 sm:px-4">
              <ReplyIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-primary">
                  Respondendo a {replyTo.name || "mensagem"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {replyTo.snippet}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Cancelar resposta"
                onClick={() => setReplyTo(null)}
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ) : null}
          <div className="flex gap-2 p-3 sm:p-4">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Digite uma mensagem"
              className="min-h-10 max-h-32 flex-1 resize-y rounded-md border border-border/60 bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0"
              disabled={sending || !draft.trim()}
              aria-label="Enviar"
            >
              <SendIcon className="size-4" />
            </Button>
          </div>
        </form>
      )}

      {order ? (
        <ReportProblemDialog
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          order={order}
          canOpen={canOpenDispute}
          onOpened={async () => {
            await loadInitial();
          }}
        />
      ) : null}
    </div>
  );
}
