"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, } from "react";
import { ArrowDownIcon, ArrowLeftIcon, CheckCheckIcon, CopyIcon, EllipsisVerticalIcon, PackageIcon, SendIcon, ShieldAlertIcon, } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { fetchConversation, fetchConversationMessages, markConversationRead, sendConversationMessage, type ConversationMessage, type ConversationSummary, } from "@/features/conversations";
import { decodeMessageBody } from "@/features/conversations/message-reply";
import { buildChatTimeline } from "@/features/conversations/chat-timeline";
import { ChatAutoDeliveryMessage, ChatDateSeparator, ChatDisputeOpenedMessage, ChatDisputeResolvedMessage, ChatSecurityMessage, } from "@/features/conversations/components/chat-timeline-parts";
import { fetchOrder } from "@/features/orders/api";
import { PurchaseProtection } from "@/features/orders/components/purchase-protection";
import { orderStatusLabel, orderStatusShortLabel, orderStatusBadgeClass } from "@/features/orders/labels";
import type { Order } from "@/features/orders/types";
import { ReportProblemDialog } from "@/features/disputes/components/report-problem-dialog";
import { usePresence, useRealtime } from "@/features/realtime";
import type { RealtimeConversationReadEvent, RealtimeMessageEvent } from "@/features/realtime/events";
import { ConversationThreadSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { useDashboardSummaryOptional } from "@/features/dashboard/context/dashboard-summary-context";
import { playNotifySound } from "@/features/notifications/notify-sound";
import { userInitial } from "@/features/listings/components/qa-utils";
import { ApiError } from "@/lib/api/errors";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { routes } from "@/lib/routes";
import { formatOrderCode, orderRouteRef } from "@/lib/order-code";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { FaArrowUp } from "react-icons/fa6";

const CLOSED = new Set(["REFUNDED", "CANCELLED", "EXPIRED"]);
const DISPUTE_OPEN = new Set(["PAID", "DELIVERED"]);

function wasReadBy(lastReadAt: string | null | undefined, createdAt: string) {
  if (!lastReadAt) return false;
  return new Date(createdAt).getTime() <= new Date(lastReadAt).getTime();
}

function newClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

function formatMsgTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
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
            "absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-black",
            online ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/50",
          )}
        />
      ) : null}
    </span>
  );
};

type Props = {
  conversationId: string;
  embedded?: boolean;
};

export function ConversationThreadClient({ conversationId, embedded = false, }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { socket, connected } = useRealtime();
  const dashboard = useDashboardSummaryOptional();
  const dashboardRefreshRef = useRef(dashboard?.refresh);
  dashboardRefreshRef.current = dashboard?.refresh;
  const [conversation, setConversation] = useState<ConversationSummary | null>(null,);
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
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
  const roomId = conversation?.id ?? null;

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
        orderRouteRef(convRes.conversation.order),
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
    function onGlobalKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true'], [role='textbox']",
        )
      ) {
        return;
      }

      const ta = inputRef.current;
      if (!ta || ta.disabled) return;

      e.preventDefault();
      const start = ta.selectionStart ?? ta.value.length;
      const end = ta.selectionEnd ?? ta.value.length;
      const next = ta.value.slice(0, start) + e.key + ta.value.slice(end);
      setDraft(next);
      ta.focus();
      window.requestAnimationFrame(() => {
        const pos = start + e.key.length;
        ta.setSelectionRange(pos, pos);
        ta.style.height = "0px";
        ta.style.height = `${Math.min(Math.max(ta.scrollHeight, 44), 160)}px`;
      });
    }

    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!socket || !connected || !roomId) return;

    socket.emit("conversation:join", { conversationId: roomId }, (ack) => {
      if (ack && !ack.ok) {
        setError((prev) => prev ?? "Não foi possível entrar no chat ao vivo.");
      }
    });

    function onMessage(payload: RealtimeMessageEvent) {
      if (payload.conversationId !== roomId) return;
      if (stickToBottom.current) {
        setShowJump(false);
      }
      setMessages((prev) => mergeMessages(prev, [payload.message]));
      if (user?.id && payload.message.senderId !== user.id) {
        playNotifySound();
        void markConversationRead(conversationId)
          .then(() => {
            void dashboardRefreshRef.current?.();
          })
          .catch(() => undefined);
      }
    }

    function onConversationRead(payload: RealtimeConversationReadEvent) {
      if (payload.conversationId !== roomId) return;
      setConversation((prev) =>
        prev
          ? {
            ...prev,
            buyerLastReadAt: payload.buyerLastReadAt,
            sellerLastReadAt: payload.sellerLastReadAt,
            adminLastReadAt: payload.adminLastReadAt,
          }
          : prev,
      );
    }

    socket.on("message:new", onMessage);
    socket.on("conversation:read", onConversationRead);

    return () => {
      socket.emit("conversation:leave", { conversationId: roomId });
      socket.off("message:new", onMessage);
      socket.off("conversation:read", onConversationRead);
    };
  }, [socket, connected, roomId, conversationId, user?.id]);

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

    const payload = text;
    const clientId = newClientId();
    const optimistic: ConversationMessage = {
      id: `optimistic:${clientId}`,
      conversationId: roomId ?? conversationId,
      senderId: user.id,
      body: payload,
      clientId,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name },
    };

    setDraft("");
    if (inputRef.current) {
      inputRef.current.style.height = "44px";
    }
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
            {
              conversationId: roomId ?? conversationId,
              body: payload,
              clientId,
            },
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

  const timeline = useMemo(
    () =>
      buildChatTimeline({
        messages,
        order,
        conversationCreatedAt: conversation?.createdAt ?? "",
        listingTitle: conversation?.order.listing.title ?? "",
      }),
    [
      messages,
      order,
      conversation?.createdAt,
      conversation?.order.listing.title,
    ],
  );

  const hasUserMessages = messages.length > 0;

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
  const orderStatus = order?.status ?? conversation.order.status;
  const canConfirmReceipt = Boolean(isBuyer) && orderStatus === "DELIVERED" && !order?.dispute;
  const listingCover = conversation.order.listing.media?.[0]?.url;
  const orderRef = conversation ? formatOrderCode(conversation.order) : conversationId;

  return (
    <div className="flex h-full w-full min-h-0 flex-1 flex-col overflow-hidden bg-card/30">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={routes.dashboardMessages}
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              embedded && "lg:hidden",
            )}
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
              <h2 className="truncate text-sm font-semibold tracking-tight tabular-nums sm:text-base">
                Pedido #{orderRef}
              </h2>
              <span
                className={cn(
                  "inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 text-[10px] font-medium",
                  orderStatusBadgeClass(conversation.order.status),
                )}
              >
                {orderStatusShortLabel(conversation.order.status)}
              </span>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {conversation.order.listing.title}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "text-muted-foreground",
            )}
            aria-label="Opções da conversa"
          >
            <EllipsisVerticalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuItem
              onClick={() =>
                router.push(routes.order(orderRouteRef(conversation.order)))
              }
            >
              <PackageIcon />
              Ver pedido
            </DropdownMenuItem>
            {canConfirmReceipt ? (
              <DropdownMenuItem
                onClick={() =>
                  router.push(routes.order(orderRouteRef(conversation.order)))
                }
              >
                <CheckCheckIcon />
                Confirmar recebimento
              </DropdownMenuItem>
            ) : null}
            {canOpenDispute || order?.dispute ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setReportOpen(true)}
              >
                <ShieldAlertIcon />
                Relatar problema
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {order?.escrowHold ? (
        <PurchaseProtection hold={order.escrowHold} variant="compact" />
      ) : null}

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
          {timeline.map((item) => {
            if (item.kind === "date") {
              return <ChatDateSeparator key={item.id} at={item.at} />;
            };

            if (item.kind === "security") {
              return (
                <div key={item.id} className="px-0 md:px-12">
                  <ChatSecurityMessage listingCover={listingCover} />
                </div>
              );
            };

            if (item.kind === "auto-delivery") {
              return (
                <div key={item.id} className="px-0 md:px-12">
                  <ChatAutoDeliveryMessage
                    content={item.content}
                    listingTitle={item.listingTitle}
                  />
                </div>
              );
            };

            if (item.kind === "dispute-opened") {
              return (
                <ChatDisputeOpenedMessage
                  key={item.id}
                  openedByName={item.openedByName}
                  reason={item.reason}
                />
              );
            };

            if (item.kind === "dispute-resolved") {
              return (
                <ChatDisputeResolvedMessage
                  key={item.id}
                  resolutionLabel={item.resolutionLabel}
                  notes={item.notes}
                />
              );
            };

            const msg = item.message;
            const mine = user?.id === msg.senderId;
            const optimistic = msg.id.startsWith("optimistic:");
            const decoded = decodeMessageBody(msg.body);
            const counterpartyRead = mine ? wasReadBy(isBuyer ? conversation.sellerLastReadAt : conversation.buyerLastReadAt, msg.createdAt,) : false;
            const mediatorRead = mine ? wasReadBy(conversation.adminLastReadAt, msg.createdAt) : false;

            return (
              <div key={msg.id} id={`msg-${msg.id}`} className={cn("group/msg flex gap-2", mine ? "justify-end" : "justify-start",)}>
                {!mine ? (
                  <PartyAvatar
                    name={msg.sender?.name ?? other.name}
                    url={msg.sender?.avatarUrl ?? other.avatarUrl}
                    size="sm"
                  />
                ) : null}

                <div className={cn("flex max-w-[min(100%,28rem)] min-w-0 items-start gap-1", mine && "flex-row-reverse",)}>
                  <div className={cn("min-w-0 rounded-md px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "border border-border/60 bg-muted/40 text-foreground", optimistic && "opacity-70",)} >
                    {!mine ? (
                      <p className="mb-0.5 text-[11px] font-medium opacity-70">
                        {msg.sender?.name?.trim() || otherRole}
                      </p>
                    ) : null}

                    <p className="whitespace-pre-wrap break-words">
                      {decoded.body}
                    </p>

                    <div className={cn("mt-1 flex items-center justify-end gap-1.5 text-[10px] tabular-nums", mine ? "opacity-90" : "text-muted-foreground",)} >
                      <span>
                        {formatMsgTime(msg.createdAt)}
                        {optimistic ? " · enviando" : null}
                      </span>

                      {mine && !optimistic ? (
                        <span className="inline-flex items-center gap-0.5" aria-label="Visualizações">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span
                                  className={cn(
                                    "inline-flex",
                                    counterpartyRead
                                      ? "text-sky-200"
                                      : "opacity-50",
                                  )}
                                />
                              }
                            >
                              <CheckCheckIcon className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {counterpartyRead
                                ? `Visto pelo ${isBuyer ? "vendedor" : "comprador"}`
                                : `Aguardando ${isBuyer ? "vendedor" : "comprador"}`}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span
                                  className={cn(
                                    "inline-flex",
                                    mediatorRead
                                      ? "text-emerald-200"
                                      : "opacity-50",
                                  )}
                                />
                              }
                            >
                              <CheckCheckIcon className="size-3.5" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {mediatorRead
                                ? "Visto pelo mediador"
                                : "Aguardando mediador"}
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/msg:opacity-100 group-focus-within/msg:opacity-100 data-[popup-open]:opacity-100",
                      )}
                      aria-label="Opções da mensagem"
                    >
                      <EllipsisVerticalIcon className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={mine ? "end" : "start"}
                      className="min-w-36"
                    >
                      <DropdownMenuItem
                        onClick={() => void copyMessage(msg)}
                      >
                        <CopyIcon />
                        {copiedId === msg.id ? "Copiado" : "Copiar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}

          {!hasUserMessages ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma mensagem ainda. Digite abaixo para falar com{" "}
              {isBuyer ? "o vendedor" : "o comprador"}.
            </p>
          ) : null}
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
        <form onSubmit={(e) => void handleSend(e)} className="shrink-0 space-y-2 border-t border-border/60 bg-background p-3" >
          <div className={cn("relative flex items-center rounded-md border border-border/60 bg-background focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 px-2")}>
            <Textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                const el = e.currentTarget;
                el.style.height = "0px";
                el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={4000}
              placeholder="Digite uma mensagem"
              className="max-h-40 min-h-11 w-full items-center resize-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border-0 bg-background dark:bg-background/0 py-2.5 pr-12 pl-3 shadow-none focus-visible:ring-0"
              disabled={sending}
            />

            <Button
              type="submit"
              size="icon-lg"
              className={cn(
                "size-8 cursor-pointer rounded-full",
              )}
              disabled={sending || !draft.trim()}
              aria-label="Enviar"
            >
              <FaArrowUp className="size-4" />
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
