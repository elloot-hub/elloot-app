"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BellIcon,
  CheckCheckIcon,
  GavelIcon,
  HelpCircleIcon,
  MessageSquareIcon,
  PackageIcon,
  StarIcon,
  StoreIcon,
} from "lucide-react";
import { useNotifications } from "@/features/notifications";
import { NotificationPreferencesDialogButton } from "@/features/notifications/components/notification-preferences-dialog";
import { safeInternalHref } from "@/features/notifications/safe-href";
import type { AppNotification } from "@/features/notifications/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CategoryFilter =
  | "all"
  | "MESSAGE"
  | "ORDER"
  | "DISPUTE"
  | "QUESTION"
  | "REVIEW"
  | "SYSTEM";
type ReadFilter = "all" | "unread" | "read";

const CATEGORIES: Array<{
  id: CategoryFilter;
  label: string;
  types?: string[];
}> = [
  { id: "all", label: "Todos" },
  { id: "MESSAGE", label: "Chats", types: ["MESSAGE"] },
  { id: "ORDER", label: "Pedidos", types: ["ORDER"] },
  { id: "DISPUTE", label: "Tickets", types: ["DISPUTE"] },
  { id: "QUESTION", label: "Perguntas", types: ["QUESTION"] },
  { id: "REVIEW", label: "Avaliações", types: ["REVIEW"] },
  { id: "SYSTEM", label: "Sistema", types: ["SYSTEM", "LISTING"] },
];

const READ_ITEMS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "read", label: "Lidas" },
] as const;

const CATEGORY_ITEMS = CATEGORIES.map((cat) => ({
  value: cat.id,
  label: cat.label,
}));

function matchesCategory(item: AppNotification, category: CategoryFilter) {
  if (category === "all") return true;
  const def = CATEGORIES.find((c) => c.id === category);
  if (!def?.types) return true;
  const type = item.type.toUpperCase();
  return def.types.some((t) => type === t || type.startsWith(`${t}_`));
}

function matchesRead(item: AppNotification, filter: ReadFilter) {
  if (filter === "all") return true;
  if (filter === "unread") return !item.read;
  return item.read;
}

function categoryIcon(type: string) {
  const t = type.toUpperCase();
  if (t.startsWith("MESSAGE")) return MessageSquareIcon;
  if (t.startsWith("ORDER")) return PackageIcon;
  if (t.startsWith("DISPUTE")) return GavelIcon;
  if (t.startsWith("QUESTION")) return HelpCircleIcon;
  if (t.startsWith("REVIEW")) return StarIcon;
  if (t.startsWith("SYSTEM") || t.startsWith("LISTING")) return StoreIcon;
  return BellIcon;
}

function metaLabel(meta: unknown): string | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (typeof m.orderCode === "string") return `Pedido · ${m.orderCode}`;
  if (typeof m.orderId === "string") return `Pedido · ${m.orderId.slice(0, 8)}`;
  if (typeof m.listingCode === "string") return `Anúncio · ${m.listingCode}`;
  if (typeof m.listingId === "string")
    return `Anúncio · ${m.listingId.slice(0, 8)}`;
  if (typeof m.payoutCode === "string") return `Saque · ${m.payoutCode}`;
  if (typeof m.payoutId === "string") return `Saque · ${m.payoutId.slice(0, 8)}`;
  if (typeof m.disputeCode === "string") return `Disputa · ${m.disputeCode}`;
  if (typeof m.disputeId === "string")
    return `Disputa · ${m.disputeId.slice(0, 8)}`;
  return null;
}

export function NotificationsListClient() {
  const {
    items,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesCategory(item, category) && matchesRead(item, readFilter),
      ),
    [items, category, readFilter],
  );

  const categoryLabel =
    CATEGORIES.find((c) => c.id === category)?.label ?? "esta categoria";

  if (loading && items.length === 0) {
    return <NotificationsListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={readFilter}
            items={[...READ_ITEMS]}
            onValueChange={(value) =>
              setReadFilter((value ?? "all") as ReadFilter)
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {READ_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={category}
            items={CATEGORY_ITEMS}
            onValueChange={(value) =>
              setCategory((value ?? "all") as CategoryFilter)
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NotificationPreferencesDialogButton
            label="Preferências"
            className="gap-1.5"
          />
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5",
              )}
            >
              <CheckCheckIcon className="size-3.5" />
              Marcar todas como lidas
            </button>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellIcon className="size-4" />
          </span>
          <p className="text-sm font-medium">Nenhuma notificação ainda</p>
          <p className="text-sm text-muted-foreground text-pretty">
            Pedidos, chats, disputas e moderação aparecem aqui em tempo real.
          </p>
          <Link
            href={routes.dashboardMessages}
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ir para mensagens
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 px-5 py-10 text-center space-y-1">
          <p className="text-sm font-medium">Nada em {categoryLabel}</p>
          <p className="text-sm text-muted-foreground">
            Tente outra categoria ou status de leitura.
          </p>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-md border border-border/60 bg-card/30 divide-y divide-border/50">
            {filtered.map((item) => {
              const safeHref = safeInternalHref(item.href);
              const Icon = categoryIcon(item.type);
              const meta = metaLabel(item.meta);
              const rowClass = cn(
                "flex items-start gap-3 px-3 py-3 transition-colors sm:px-4",
                !item.read && "bg-primary/[0.04]",
                "hover:bg-muted/30",
              );

              const body = (
                <>
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border/50",
                      !item.read
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-pretty">
                        {item.title}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </span>
                    <span className="block text-xs text-muted-foreground text-pretty">
                      {item.body}
                    </span>
                    {meta ? (
                      <span className="block font-mono text-[10px] text-muted-foreground/80">
                        {meta}
                      </span>
                    ) : null}
                  </span>
                  {!item.read ? (
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  ) : (
                    <span className="mt-2 size-1.5 shrink-0" />
                  )}
                </>
              );

              return (
                <li key={item.id}>
                  <div className={rowClass}>
                    {safeHref ? (
                      <Link
                        href={safeHref}
                        onClick={() => void markRead(item.id)}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void markRead(item.id)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        {body}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore && category === "all" && readFilter === "all" ? (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                {loadingMore ? "Carregando…" : "Carregar mais"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
