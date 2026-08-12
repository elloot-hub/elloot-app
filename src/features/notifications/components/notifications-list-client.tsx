"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellIcon, CheckCheckIcon, EyeIcon, GavelIcon, HelpCircleIcon, MessageSquareIcon, PackageIcon, SettingsIcon, StarIcon, StoreIcon, } from "lucide-react";
import { useNotifications } from "@/features/notifications";
import { safeInternalHref } from "@/features/notifications/safe-href";
import type { AppNotification } from "@/features/notifications/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationsListSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { formatRelativeTime } from "@/features/listings/components/qa-utils";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type CategoryFilter = | "all" | "MESSAGE" | "ORDER" | "DISPUTE" | "QUESTION" | "REVIEW" | "SYSTEM";
type ReadFilter = "all" | "unread" | "read";

const CATEGORIES: Array<{ id: CategoryFilter; label: string; types?: string[]; }> = [
  { id: "all", label: "Todos" },
  { id: "MESSAGE", label: "Chats", types: ["MESSAGE"] },
  { id: "ORDER", label: "Vendas", types: ["ORDER"] },
  { id: "DISPUTE", label: "Tickets", types: ["DISPUTE"] },
  { id: "QUESTION", label: "Perguntas", types: ["QUESTION"] },
  { id: "REVIEW", label: "Avaliações", types: ["REVIEW"] },
  { id: "SYSTEM", label: "Sistema", types: ["SYSTEM"] },
];

function matchesCategory(item: AppNotification, category: CategoryFilter) {
  if (category === "all") return true;
  const def = CATEGORIES.find((c) => c.id === category);
  if (!def?.types) return true;
  const type = item.type.toUpperCase();
  return def.types.some((t) => type === t || type.startsWith(`${t}_`));
};

function matchesRead(item: AppNotification, filter: ReadFilter) {
  if (filter === "all") return true;
  if (filter === "unread") return !item.read;
  return item.read;
};

function categoryIcon(type: string) {
  const t = type.toUpperCase();
  if (t.startsWith("MESSAGE")) return MessageSquareIcon;
  if (t.startsWith("ORDER")) return PackageIcon;
  if (t.startsWith("DISPUTE")) return GavelIcon;
  if (t.startsWith("QUESTION")) return HelpCircleIcon;
  if (t.startsWith("REVIEW")) return StarIcon;
  if (t.startsWith("SYSTEM") || t.startsWith("LISTING")) return StoreIcon;
  return BellIcon;
};

export function NotificationsListClient() {
  const { items, loading, markRead, markAllRead, unreadCount } = useNotifications();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          matchesCategory(item, category) && matchesRead(item, readFilter),
      ),
    [items, category, readFilter],
  );

  if (loading && items.length === 0) {
    return <NotificationsListSkeleton />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Select
            value={readFilter}
            onValueChange={(value) => {
              setReadFilter(value as ReadFilter);
              setSelected(new Set());
            }}
          >
            <SelectTrigger className="h-9 rounded-md border border-border/60 bg-background px-2.5 text-sm text-foreground">
              <SelectValue placeholder="Selecionar status" />
            </SelectTrigger>
            <SelectContent className="w-36 rounded-md">
              <SelectItem value="all" className="text-sm text-foreground rounded-sm px-2.5 cursor-pointer">Todas</SelectItem>
              <SelectItem value="unread" className="text-sm text-foreground rounded-sm px-2.5 cursor-pointer">Não lidas</SelectItem>
              <SelectItem value="read" className="text-sm text-foreground rounded-sm px-2.5 cursor-pointer">Lidas</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <Select value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
          <SelectTrigger className="h-9 rounded-md border border-border/60 bg-background px-2.5 text-sm text-foreground">
            <SelectValue placeholder="Selecionar categoria" />
          </SelectTrigger>
          <SelectContent className="w-36 rounded-md">
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="text-sm text-foreground rounded-sm px-2.5 cursor-pointer">{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação ainda. Mensagens e disputas aparecem aqui em
            tempo real.
          </p>
          <Link
            href={routes.dashboardMessages}
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ir para mensagens
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nada neste filtro. Tente outra categoria ou status.
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-md border border-border/60 bg-card/30 divide-y divide-border/50">
          {filtered.map((item) => {
            const safeHref = safeInternalHref(item.href);
            const Icon = categoryIcon(item.type);
            const checked = selected.has(item.id);
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
                </span>
                {!item.read ? (
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                ) : (
                  <span className="mt-2 size-1.5 shrink-0" />
                )}
              </>
            );

            return (
              <li key={item.id} className="group">
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
      )}
    </div>
  );
};