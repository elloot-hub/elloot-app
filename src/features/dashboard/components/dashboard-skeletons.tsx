import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function CardShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Resumo / overview do painel */
export function OverviewSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando resumo">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardShell key={`bal-${i}`} className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-40" />
          </CardShell>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardShell key={`stat-${i}`} className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-4 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-28" />
          </CardShell>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardShell key={`info-${i}`} className="flex gap-3">
            <Skeleton className="size-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-3/4 max-w-xs" />
            </div>
          </CardShell>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <CardShell key={`cta-${i}`} className="space-y-3 p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-32" />
          </CardShell>
        ))}
      </div>
    </div>
  );
}

/** Lista de compras / vendas (cards horizontais) */
export function OrderListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul
      className="space-y-3"
      aria-busy="true"
      aria-label="Carregando pedidos"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <CardShell className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24 rounded-md" />
              </div>
              <Skeleton className="h-4 w-72 max-w-full" />
              <Skeleton className="h-3 w-56 max-w-full" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-9 w-28 shrink-0" />
          </CardShell>
        </li>
      ))}
    </ul>
  );
}

/** Meus anúncios */
export function ListingsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul
      className="space-y-3"
      aria-busy="true"
      aria-label="Carregando anúncios"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i}>
          <CardShell className="flex gap-3 sm:items-center">
            <Skeleton className="size-16 shrink-0 rounded-md sm:size-20" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="hidden h-6 w-20 sm:block" />
          </CardShell>
        </li>
      ))}
    </ul>
  );
}

/** Grade de favoritos (cards de listing) */
export function FavoritesSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Carregando favoritos"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <CardShell key={i} className="space-y-3 overflow-hidden p-0">
          <Skeleton className="aspect-[4/3] w-full rounded-none rounded-t-md" />
          <div className="space-y-2 px-3 pb-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardShell>
      ))}
    </div>
  );
}

/** Métricas */
export function MetricsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando métricas">
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardShell key={i} className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </CardShell>
        ))}
      </div>
    </div>
  );
}

/** Carteira / extrato */
export function WalletSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando carteira">
      <CardShell className="space-y-3 p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardShell>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Inbox de mensagens */
export function ConversationsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ul
      className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60"
      aria-busy="true"
      aria-label="Carregando conversas"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          <Skeleton className="h-3 w-16 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** Thread de chat */
export function ConversationThreadSkeleton() {
  return (
    <div
      className="flex min-h-[min(70vh,640px)] flex-col overflow-hidden rounded-md border border-border/60 bg-card/30"
      aria-busy="true"
      aria-label="Carregando conversa"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3 py-3 sm:px-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0" />
      </div>
      <div className="flex-1 space-y-3 px-3 py-4 sm:px-4">
        <div className="flex justify-start">
          <Skeleton className="h-16 w-56 rounded-md" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-12 w-48 rounded-md" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-20 w-64 rounded-md" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/60 p-3 sm:p-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="size-10 shrink-0" />
      </div>
    </div>
  );
}

/** Notificações */
export function NotificationsListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul
      className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60"
      aria-busy="true"
      aria-label="Carregando notificações"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="space-y-2 px-3 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1 size-1.5 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full max-w-md" />
          <Skeleton className="h-3 w-24" />
        </li>
      ))}
    </ul>
  );
}

/** Configurações / verificação */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando conta">
      <CardShell className="grid gap-4 p-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </CardShell>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
    </div>
  );
}

export function VerificationSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando verificação">
      <CardShell className="flex gap-3 p-5">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
      </CardShell>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardShell key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </CardShell>
        ))}
      </div>
    </div>
  );
}

/** Detalhe do pedido */
export function OrderDetailSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:items-start"
      aria-busy="true"
      aria-label="Carregando pedido"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-4 rounded-2xl border border-border/70 bg-card/60 p-4">
          <Skeleton className="size-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/60 p-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </aside>
    </div>
  );
}
