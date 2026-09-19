"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellIcon, CheckIcon, InboxIcon, Settings2Icon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/features/auth/context";
import { loginHref } from "@/features/auth/safe-next";
import { useNotifications } from "@/features/notifications";
import { NotificationPreferencesDialog } from "@/features/notifications/components/notification-preferences-dialog";
import { safeInternalHref } from "@/features/notifications/safe-href";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

type Props = {
  className?: string;
};

type Tab = "inbox" | "archived";

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "agora";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function NotificationsButton({ className }: Props) {
  const pathname = usePathname();
  const { token } = useAuth();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("inbox");

  const visible = useMemo(() => {
    if (tab === "inbox") return items.filter((item) => !item.read);
    return items.filter((item) => item.read);
  }, [items, tab]);

  if (!token) {
    return (
      <Link
        href={loginHref(pathname)}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "relative rounded-full",
          className,
        )}
        aria-label="Notificações"
        title="Entre para ver notificações"
      >
        <BellIcon className="size-4" />
      </Link>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "relative rounded-full",
            className,
          )}
          aria-label={
            unreadCount > 0
              ? `Notificações (${unreadCount} não lidas)`
              : "Notificações"
          }
          title="Notificações"
        >
          <BellIcon className="size-4" />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background tabular-nums"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[min(100vw-2rem,22rem)] gap-0 overflow-hidden p-0"
        >
          <PopoverHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 px-3 py-2.5">
            <div className="min-w-0">
              <PopoverTitle>Notificações</PopoverTitle>
              <PopoverDescription className="text-xs">
                Pedidos, mensagens e conta em tempo real
              </PopoverDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-primary hover:bg-muted/50"
                >
                  <CheckIcon className="size-3.5" />
                  <span className="hidden sm:inline">Marcar lidas</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPrefsOpen(true);
                }}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "rounded-md",
                )}
                aria-label="Configurar notificações"
                title="Configurar notificações"
              >
                <Settings2Icon className="size-3.5" />
              </button>
            </div>
          </PopoverHeader>

          <div className="flex gap-1 border-b border-border/60 p-1.5">
            <TabButton
              active={tab === "inbox"}
              onClick={() => setTab("inbox")}
              count={items.filter((i) => !i.read).length}
            >
              Caixa de entrada
            </TabButton>
            <TabButton
              active={tab === "archived"}
              onClick={() => setTab("archived")}
            >
              Lidas
            </TabButton>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <InboxIcon className="size-4" />
                </span>
                <p className="text-sm font-medium">Nenhuma notificação</p>
                <p className="text-xs text-muted-foreground text-pretty">
                  Avisos de chat, disputas e pedidos aparecem aqui em tempo
                  real.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/50">
                {visible.map((item) => {
                  const safeHref = safeInternalHref(item.href);
                  return (
                    <li key={item.id}>
                      {safeHref ? (
                        <Link
                          href={safeHref}
                          onClick={() => void markRead(item.id)}
                          className={cn(
                            "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                            !item.read && "bg-primary/5",
                          )}
                        >
                          <NotificationBody item={item} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void markRead(item.id)}
                          className={cn(
                            "flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                            !item.read && "bg-primary/5",
                          )}
                        >
                          <NotificationBody item={item} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border/60 p-2">
            <Link
              href={routes.dashboardNotifications}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-muted/40"
            >
              Ver todas
            </Link>
          </div>
        </PopoverContent>
      </Popover>

      <NotificationPreferencesDialog
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
      />
    </>
  );
}

function NotificationBody({
  item,
}: {
  item: {
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    meta?: unknown;
  };
}) {
  const meta =
    item.meta && typeof item.meta === "object"
      ? (() => {
          const m = item.meta as Record<string, unknown>;
          if (typeof m.orderId === "string") return "Pedido";
          if (typeof m.listingId === "string") return "Anúncio";
          if (typeof m.payoutId === "string") return "Saque";
          if (typeof m.disputeId === "string") return "Disputa";
          return null;
        })()
      : null;

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{item.title}</p>
        {!item.read ? (
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground text-pretty">{item.body}</p>
      <p className="flex items-center gap-1.5 pt-0.5 font-mono text-[10px] text-muted-foreground">
        <span>{formatWhen(item.createdAt)}</span>
        {meta ? (
          <>
            <span aria-hidden>·</span>
            <span>{meta}</span>
          </>
        ) : null}
      </p>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {typeof count === "number" && count > 0 ? (
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}
