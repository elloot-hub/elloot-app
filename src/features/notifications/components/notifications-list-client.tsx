"use client";

import Link from "next/link";
import { useNotifications } from "@/features/notifications";
import { NotificationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

export function NotificationsListClient() {
  const { items, loading, markRead, markAllRead, unreadCount } =
    useNotifications();

  if (loading && items.length === 0) {
    return <NotificationsListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Nenhuma notificação ainda. Mensagens e disputas aparecem aqui em tempo
          real.
        </p>
        <Link
          href={routes.dashboardMessages}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ir para mensagens
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unreadCount > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-xs font-medium text-primary hover:underline"
          >
            Marcar todas como lidas
          </button>
        </div>
      ) : null}
      <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
        {items.map((item) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                {!item.read ? (
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                {item.body}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {formatWhen(item.createdAt)}
              </p>
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => void markRead(item.id)}
                  className={cn(
                    "block px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4",
                    !item.read && "bg-primary/5",
                  )}
                >
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void markRead(item.id)}
                  className={cn(
                    "block w-full px-3 py-3 text-left transition-colors hover:bg-muted/30 sm:px-4",
                    !item.read && "bg-primary/5",
                  )}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
