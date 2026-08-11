"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import {
  fetchConversation,
  fetchConversationMessages,
  sendConversationMessage,
  type ConversationMessage,
  type ConversationSummary,
} from "@/features/conversations";
import { orderStatusLabel } from "@/features/orders/labels";
import { usePresence, useRealtime } from "@/features/realtime";
import type { RealtimeMessageEvent } from "@/features/realtime/events";
import { ConversationThreadSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { playNotifySound } from "@/features/notifications/notify-sound";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const CLOSED = new Set(["COMPLETED", "REFUNDED", "CANCELLED", "EXPIRED"]);

function newClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

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
}

function mergeMessages(
  prev: ConversationMessage[],
  incoming: ConversationMessage[],
) {
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
}

type Props = {
  conversationId: string;
};

export function ConversationThreadClient({ conversationId }: Props) {
  const { user } = useAuth();
  const { socket, connected } = useRealtime();
  const [conversation, setConversation] = useState<ConversationSummary | null>(
    null,
  );
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const otherId = conversation && user ? user.id === conversation.order.buyerId ? conversation.order.sellerId : conversation.order.buyerId : null;
  const otherPresence = usePresence(otherId);

  const scrollToBottom = useCallback(() => {
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadInitial = useCallback(async () => {
    const [convRes, msgRes] = await Promise.all([
      fetchConversation(conversationId),
      fetchConversationMessages(conversationId, { limit: 100 }),
    ]);
    setConversation(convRes.conversation);
    setMessages(msgRes.messages);
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
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("conversation:join", { conversationId }, (ack) => {
      if (ack && !ack.ok) {
        setError((prev) => prev ?? "Não foi possível entrar no chat ao vivo.");
      }
    });

    function onMessage(payload: RealtimeMessageEvent) {
      if (payload.conversationId !== conversationId) return;
      stickToBottom.current = true;
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

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !user) return;

    const clientId = newClientId();
    const optimistic: ConversationMessage = {
      id: `optimistic:${clientId}`,
      conversationId,
      senderId: user.id,
      body: text,
      clientId,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name },
    };

    setDraft("");
    setSending(true);
    setError(null);
    stickToBottom.current = true;
    setMessages((prev) => mergeMessages(prev, [optimistic]));

    try {
      if (socket?.connected) {
        await new Promise<void>((resolve, reject) => {
          socket.emit(
            "message:send",
            { conversationId, body: text, clientId },
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
          text,
          { clientId },
        );
        setMessages((prev) => mergeMessages(prev, [message]));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
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
  }

  if (loading) {
    return <ConversationThreadSkeleton />;
  }

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
  }

  const other = user?.id === conversation.order.buyerId ? conversation.order.seller : conversation.order.buyer;
  const closed = CLOSED.has(conversation.order.status);

  return (
    <div className="flex min-h-[min(70vh,640px)] max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-md border border-border/60 bg-card/30">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
        <div className="min-w-0 space-y-1">
          <Link
            href={routes.dashboardMessages}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" />
            Mensagens
          </Link>
          <h2 className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {conversation.order.listing.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            Com {other.name?.trim() || "usuário"} ·{" "}
            <span
              className={cn(
                "font-medium",
                otherPresence.online
                  ? "text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {otherPresence.online ? "online" : "offline"}
            </span>
            {" · "}
            {formatBRLFromCents(conversation.order.amountCents)} ·{" "}
            {orderStatusLabel(conversation.order.status)}
            {!connected ? (
              <span className="text-amber-400"> · reconectando…</span>
            ) : null}
          </p>
        </div>
        <Link
          href={routes.order(conversation.orderId)}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0",
          )}
        >
          Ver pedido
        </Link>
      </header>

      <div
        className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Digite abaixo para iniciar.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = user?.id === msg.senderId;
            const optimistic = msg.id.startsWith("optimistic:");
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  mine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[min(100%,28rem)] rounded-md px-3 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/60 bg-muted/40 text-foreground",
                    optimistic && "opacity-70",
                  )}
                >
                  {!mine ? (
                    <p className="mb-0.5 text-[11px] font-medium opacity-70">
                      {msg.sender?.name?.trim() || "Usuário"}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px] tabular-nums",
                      mine ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {formatMsgTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <p className="border-t border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      {closed ? (
        <p className="border-t border-border/60 px-3 py-3 text-center text-xs text-muted-foreground sm:px-4">
          Esta conversa está encerrada para novos envios (pedido{" "}
          {orderStatusLabel(conversation.order.status).toLowerCase()}).
        </p>
      ) : (
        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex gap-2 border-t border-border/60 p-3 sm:p-4"
        >
          <textarea
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
            placeholder="Escreva uma mensagem…"
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
        </form>
      )}
    </div>
  );
}
