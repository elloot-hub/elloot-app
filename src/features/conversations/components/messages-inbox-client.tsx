"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { InboxIcon, MessageSquareIcon, SearchIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import {
  fetchConversations,
  markConversationRead,
  type ConversationSummary,
} from "@/features/conversations";
import { previewMessageBody } from "@/features/conversations/message-reply";
import { ConversationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { useDashboardSummaryOptional } from "@/features/dashboard/context/dashboard-summary-context";
import {
  orderStatusBadgeClass,
  orderStatusShortLabel,
} from "@/features/orders/labels";
import { useRealtime } from "@/features/realtime";
import type { RealtimeMessageEvent } from "@/features/realtime/events";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { formatOrderCode, orderRouteRef } from "@/lib/order-code";
import { cn } from "@/lib/utils";

type RoleFilter = "all" | "purchases" | "sales";

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "purchases", label: "Compras" },
  { id: "sales", label: "Vendas" },
];

function relativeTime(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Date.now() - then;
  if (diff < -120_000) {
    return new Date(then).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  }
  const mins = Math.floor(Math.max(0, diff) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(then).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Tempo da lista: última mensagem real — nunca `updatedAt` (sobe ao abrir/ler). */
function activityStamp(c: ConversationSummary) {
  return c.lastMessageAt ?? c.createdAt;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function conversationMatchesRef(c: ConversationSummary, ref: string | null) {
  if (!ref) return false;
  if (ref === c.id) return true;
  if (ref === c.orderId) return true;
  if (ref === c.order.code) return true;
  if (ref === c.order.id) return true;
  return false;
}

function conversationHref(c: ConversationSummary) {
  return routes.conversation(orderRouteRef(c.order));
}

type Props = {
  children: ReactNode;
};

export function MessagesInboxClient({ children }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();
  const activeId =
    pathname.match(/\/dashboard\/messages\/([^/?#]+)/)?.[1] ?? null;
  const { socket, connected } = useRealtime();
  const dashboard = useDashboardSummaryOptional();
  const dashboardRefreshRef = useRef(dashboard?.refresh);
  dashboardRefreshRef.current = dashboard?.refresh;

  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { conversations } = await fetchConversations();
        if (!cancelled) setRows(conversations);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar as mensagens.",
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

  useEffect(() => {
    if (!socket || !connected || !user) return;

    function onMessage(payload: RealtimeMessageEvent) {
      const preview = previewMessageBody(payload.message.body);
      const fromOther = payload.message.senderId !== user!.id;
      let viewing = false;

      setRows((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.conversationId);
        viewing =
          Boolean(activeId) &&
          idx >= 0 &&
          conversationMatchesRef(prev[idx]!, activeId);
        if (idx < 0) {
          void fetchConversations()
            .then((res) => setRows(res.conversations))
            .catch(() => undefined);
          return prev;
        }

        const current = prev[idx]!;
        // Idempotent: ignore if we already applied this message as preview.
        if (current.messages?.[0]?.id === payload.message.id) {
          return prev;
        }

        const next: ConversationSummary = {
          ...current,
          lastMessageAt: payload.message.createdAt,
          lastMessagePreview: preview,
          unreadCount: fromOther
            ? viewing
              ? 0
              : (current.unreadCount ?? 0) + 1
            : (current.unreadCount ?? 0),
          messages: [
            {
              id: payload.message.id,
              body: payload.message.body,
              senderId: payload.message.senderId,
              createdAt: payload.message.createdAt,
            },
          ],
        };

        const rest = prev.filter((_, i) => i !== idx);
        return [next, ...rest];
      });

      if (fromOther && !viewing) {
        void dashboardRefreshRef.current?.();
      }
    }

    socket.on("message:new", onMessage);
    return () => {
      socket.off("message:new", onMessage);
    };
  }, [socket, connected, user, activeId]);

  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;
    void markConversationRead(activeId)
      .then(() => {
        if (cancelled) return;
        setRows((prev) =>
          prev.map((c) =>
            conversationMatchesRef(c, activeId) ? { ...c, unreadCount: 0 } : c,
          ),
        );
        void dashboardRefreshRef.current?.();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const filtered = useMemo(() => {
    if (!user) return rows;
    const q = normalize(query);
    const list = rows.filter((c) => {
      const isBuyer = user.id === c.order.buyerId;
      if (filter === "purchases" && !isBuyer) return false;
      if (filter === "sales" && isBuyer) return false;
      if (!q) return true;
      const other = isBuyer ? c.order.seller : c.order.buyer;
      const haystack = [
        c.order.listing.title,
        other.name ?? "",
        c.order.code,
        c.order.id,
        c.lastMessagePreview ?? "",
      ]
        .map(normalize)
        .join(" ");
      return haystack.includes(q);
    });

    // WhatsApp-style: most recent activity always on top.
    return [...list].sort((a, b) => {
      const aTime = new Date(activityStamp(a)).getTime();
      const bTime = new Date(activityStamp(b)).getTime();
      return bTime - aTime;
    });
  }, [rows, user, filter, query]);

  const showListOnMobile = !activeId;
  const showThreadOnMobile = Boolean(activeId);

  return (
    <div className="grid h-full min-h-0 w-full overflow-hidden rounded-md border border-border/60 bg-card/20 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <aside
        className={cn(
          "flex min-h-0 flex-col border-border/60 lg:border-r",
          showListOnMobile ? "flex" : "hidden lg:flex",
        )}
      >
        <div className="shrink-0 space-y-3 border-b border-border/60 p-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pedido, anúncio ou pessoa…"
              className="h-9 w-full rounded-md border border-border/70 bg-background/60 pr-3 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/45 focus:ring-3 focus:ring-primary/12"
            />
          </div>

          <div
            className="flex gap-1 rounded-md bg-muted/40 p-0.5"
            role="tablist"
            aria-label="Filtrar conversas"
          >
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "flex-1 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  filter === item.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3">
              <ConversationsListSkeleton rows={6} />
            </div>
          ) : error ? (
            <p className="m-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <InboxIcon className="size-4" />
              </span>
              <p className="text-sm font-medium">
                {rows.length === 0
                  ? "Nenhuma conversa ainda"
                  : "Nada neste filtro"}
              </p>
              <p className="text-xs text-muted-foreground text-pretty">
                {rows.length === 0
                  ? "Conversas aparecem quando um pedido é pago."
                  : "Tente outro filtro ou limpe a busca."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {filtered.map((c) => {
                const isBuyer = user?.id === c.order.buyerId;
                const other = isBuyer ? c.order.seller : c.order.buyer;
                const roleLabel = isBuyer ? "Compra" : "Venda";
                const last = c.messages?.[0];
                const preview = previewMessageBody(
                  c.lastMessagePreview ?? last?.body ?? "",
                );
                const stamp = activityStamp(c);
                const active = conversationMatchesRef(c, activeId);
                const orderRef = formatOrderCode(c.order);
                const unreadCount = c.unreadCount ?? 0;
                const unread = unreadCount > 0;

                return (
                  <li key={c.id}>
                    <Link
                      href={conversationHref(c)}
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/40",
                        active && "border-l-2 border-primary/60 bg-primary/10",
                        unread && !active && "bg-primary/[0.04]",
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <p
                              className={cn(
                                "truncate text-sm tabular-nums",
                                unread ? "font-bold" : "font-semibold",
                              )}
                            >
                              Pedido #{orderRef}
                            </p>
                            <span
                              className={cn(
                                "inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 text-[10px] font-medium",
                                orderStatusBadgeClass(c.order.status),
                              )}
                            >
                              {orderStatusShortLabel(c.order.status)}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-[10px] tabular-nums",
                              unread
                                ? "font-medium text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {relativeTime(stamp)}
                          </span>
                        </div>
                        <p className="line-clamp-1 text-xs text-foreground/85">
                          {c.order.listing.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              unread
                                ? "font-medium text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {other.name?.trim() || roleLabel}
                            {preview ? ` · ${preview}` : " · Sem mensagens ainda"}
                          </p>
                          <div className="ml-auto flex shrink-0 items-center gap-1.5">
                            <span className="text-xs font-medium tabular-nums text-foreground">
                              {formatBRLFromCents(c.order.amountCents)}
                            </span>
                            {unread ? (
                              <span
                                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums"
                                aria-label={`${unreadCount} mensagem(ns) não lida(s)`}
                              >
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "h-full min-h-0 min-w-0 w-full flex-col",
          showThreadOnMobile ? "flex" : "hidden lg:flex",
        )}
      >
        {children}
      </section>
    </div>
  );
}

export function MessagesEmptyPane() {
  return (
    <div className="flex h-full min-h-[min(60vh,28rem)] w-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageSquareIcon className="size-5" />
      </span>
      <p className="text-sm font-medium">Selecione uma conversa</p>
      <p className="max-w-xs text-xs text-muted-foreground text-pretty">
        Combine a entrega com segurança. Use os filtros Compras ou Vendas para
        achar o pedido certo.
      </p>
    </div>
  );
}
