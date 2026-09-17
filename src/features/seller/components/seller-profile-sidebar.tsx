"use client";

import { BadgeCheckIcon, CheckCircle2Icon, MailIcon, PackageIcon, PhoneIcon, ShieldCheckIcon, ShoppingBagIcon, StarIcon, StoreIcon, XCircleIcon, } from "lucide-react";
import type { SellerProfileStats } from "../types";
import type { SellerPublic } from "@/types/api";
import { cn } from "@/lib/utils";

type Props = {
  seller: SellerPublic;
  stats: SellerProfileStats;
  listingsCount: number;
};

export function SellerProfileSidebar({ seller, stats, listingsCount, }: Props) {
  const ratingAvg = seller.stats?.ratingAvg;
  const ratingCount = seller.stats?.ratingCount ?? 0;

  const verifications = seller.verifications ?? {
    email: false,
    phone: false,
    documents: false,
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <SidebarCard title="Detalhes">
        <SidebarRow
          icon={<StarIcon className="size-4 text-amber-400 hidden" />}
          label="Avaliação"
          value={
            ratingCount > 0 && ratingAvg != null
              ? `${ratingAvg.toFixed(1)} (${ratingCount})`
              : "Novo"
          }
        />
        <SidebarRow
          icon={<BadgeCheckIcon className="size-4 text-emerald-500 hidden" />}
          label="Avaliações positivas"
          value={`${stats.positivePercent}%`}
        />
        <SidebarRow
          icon={<StoreIcon className="size-4 text-primary hidden" />}
          label="Anúncios ativos"
          value={String(listingsCount)}
        />
      </SidebarCard>

      <SidebarCard title="Vendas">
        <SidebarRow
          icon={<PackageIcon className="size-4 text-sky-500 hidden" />}
          label="Vendidos"
          value={stats.deliveredCount.toLocaleString("pt-BR")}
        />
        <SidebarRow
          icon={<ShoppingBagIcon className="size-4 text-violet-500 hidden" />}
          label="Concluídas"
          value={stats.totalSales.toLocaleString("pt-BR")}
        />
      </SidebarCard>

      <SidebarCard title="Verificações">
        <VerificationRow
          label="E-mail"
          ok={verifications.email}
          icon={<MailIcon className="size-3.5" />}
        />
        <VerificationRow
          label="Telefone"
          ok={verifications.phone}
          icon={<PhoneIcon className="size-3.5" />}
        />
        <VerificationRow
          label="Documentos"
          ok={verifications.documents}
          icon={<ShieldCheckIcon className="size-3.5" />}
        />
      </SidebarCard>
    </aside>
  );
};

function SidebarCard({ title, children, }: { title: string; children: React.ReactNode; }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

function SidebarRow({ icon, label, value, }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
};

function VerificationRow({ label, ok, icon, }: { label: string; ok: boolean; icon: React.ReactNode; }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold",
          ok
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground",
        )}
      >
        {ok ? "Verificado" : "Não verificado"}
        {ok ? (
          <CheckCircle2Icon className="size-3.5" />
        ) : (
          <XCircleIcon className="size-3.5 opacity-70" />
        )}
      </span>
    </div>
  );
};