"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { fetchConversations, type ConversationSummary, } from "@/features/conversations";
import { previewMessageBody } from "@/features/conversations/message-reply";
import { ConversationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { formatOrderCode, orderRouteRef } from "@/lib/order-code";

export function ConversationsListClient() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <ConversationsListSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Nenhuma conversa ainda. Elas aparecem quando um pedido é pago.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
      {rows.map((c) => {
        const last = c.messages?.[0];
        const preview = previewMessageBody(
          c.lastMessagePreview ?? last?.body ?? "",
        );
        const stamp = c.lastMessageAt ?? c.createdAt;
        const other =
          user?.id === c.order.buyerId ? c.order.seller : c.order.buyer;
        return (
          <li key={c.id}>
            <Link
              href={routes.conversation(orderRouteRef(c.order))}
              className="flex items-start justify-between gap-3 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tabular-nums">
                  Pedido #{formatOrderCode(c.order)}
                </p>
                <p className="mt-0.5 truncate text-xs text-foreground/85">
                  {c.order.listing.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Com {other.name ?? "usuário"} ·{" "}
                  {formatBRLFromCents(c.order.amountCents)}
                </p>
                {preview ? (
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {preview}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sem mensagens ainda
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {new Date(stamp).toLocaleDateString("pt-BR")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
