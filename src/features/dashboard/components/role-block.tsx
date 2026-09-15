"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: string;
};

type Props = {
  title: string;
  href: string;
  stats: Stat[];
  items: string[];
  icon: LucideIcon;
  className?: string;
};

export function DashboardRoleBlock({
  title,
  href,
  stats,
  items,
  icon: Icon,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver tudo
        </Link>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <ul className="mt-3 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs text-muted-foreground">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

type OnboardingProps = {
  className?: string;
};

export function DashboardOverviewOnboarding({ className }: OnboardingProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 p-5 text-center">
        <h3 className="font-semibold tracking-tight">Explore o marketplace</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Encontre contas, itens e serviços com pagamento protegido por escrow.
        </p>
        <Link href={routes.market} className={cn(buttonVariants({ size: "sm" }), "mt-1")}>
          Ver anúncios
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 p-5 text-center">
        <h3 className="font-semibold tracking-tight">Comece a vender</h3>
        <p className="max-w-xs text-sm text-muted-foreground">
          Publique um anúncio e receba com segurança após a confirmação do
          comprador.
        </p>
        <Link
          href={routes.sell}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}
        >
          Criar anúncio
        </Link>
      </div>
    </div>
  );
}

type KycBannerProps = {
  kycStatus: string;
  className?: string;
};

export function DashboardKycBanner({ kycStatus, className }: KycBannerProps) {
  const pending = kycStatus === "PENDING";
  const rejected = kycStatus === "REJECTED";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        rejected
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {rejected
            ? "Verificação recusada"
            : pending
              ? "Verificação em análise"
              : "Complete a verificação"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {rejected
            ? "Revise seus documentos para voltar a sacar o saldo disponível."
            : pending
              ? "Seus documentos estão sendo analisados. Você será avisado quando aprovar."
              : "Necessário para sacar o saldo. Você pode anunciar sem verificação."}
        </p>
      </div>
      {!pending ? (
        <Link
          href="/dashboard/verification"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          {rejected ? "Reenviar documentos" : "Verificar agora"}
        </Link>
      ) : null}
    </div>
  );
}
