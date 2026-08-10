"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangleIcon, BadgeCheckIcon, BellIcon, ClockIcon, MessageSquareIcon, PackageIcon, PlusCircleIcon, ShieldCheckIcon, ShoppingBagIcon, StoreIcon, } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context";
import { fetchConversations } from "@/features/conversations";
import { fetchMyListings } from "@/features/listings/api";
import { fetchMyOrders } from "@/features/orders/api";
import { fetchWallet } from "@/features/wallet";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { OverviewSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

export function DashboardOverviewClient() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    listings: 0,
    activeListings: 0,
    salesPending: 0,
    salesCompleted: 0,
    purchasesOpen: 0,
    conversations: 0,
    balanceCents: 0,
    pendingReleaseCents: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [listingsRes, ordersRes, walletRes, convRes] = await Promise.all([
          fetchMyListings().catch(() => ({ listings: [] })),
          fetchMyOrders().catch(() => ({ orders: [] })),
          fetchWallet().catch(() => ({ balanceCents: 0, entries: [] })),
          fetchConversations().catch(() => ({ conversations: [] })),
        ]);
        if (cancelled || !user) return;

        const listings = listingsRes.listings ?? [];
        const orders = ordersRes.orders ?? [];

        const asSeller = orders.filter((o) => o.seller.id === user.id);
        const asBuyer = orders.filter((o) => o.buyer.id === user.id);

        const pendingReleaseCents = asSeller
          .filter((o) => o.status === "PAID" || o.status === "DELIVERED")
          .reduce((sum, o) => sum + (o.amountCents - o.feeCents), 0);

        setStats({
          listings: listings.length,
          activeListings: listings.filter((l) => l.status === "ACTIVE").length,
          salesPending: asSeller.filter(
            (o) => o.status === "PAID" || o.status === "DELIVERED",
          ).length,
          salesCompleted: asSeller.filter((o) => o.status === "COMPLETED")
            .length,
          purchasesOpen: asBuyer.filter((o) =>
            ["PENDING_PAYMENT", "PAID", "DELIVERED", "DISPUTED"].includes(
              o.status,
            ),
          ).length,
          conversations: convRes.conversations?.length ?? 0,
          balanceCents: walletRes.balanceCents ?? 0,
          pendingReleaseCents,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const verified = user?.kycStatus === "APPROVED";

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href={routes.dashboardWallet}
          className="rounded-md bg-primary p-4 text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
        >
          <p className="text-sm font-medium">
            Saldo disponível
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
            {formatBRLFromCents(stats.balanceCents)}
          </p>
          <p className="text-xs opacity-80">Liberado na carteira</p>
        </Link>

        <Link
          href={routes.dashboardSales}
          className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <p className="text-sm font-medium">
            Saldo a liberar
          </p>
          <p className="mt-1 text-2xl font-bold text-primary tabular-nums sm:text-3xl">
            {formatBRLFromCents(stats.pendingReleaseCents)}
          </p>
          <p className="text-xs text-muted-foreground">
            Em escrow / aguardando confirmação
          </p>
        </Link>

        <Link
          href={routes.dashboardWithdrawals}
          className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40"
        >
          <p className="text-sm font-medium">
            Saque pendente
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
            R$ 0,00
          </p>
          <p className="text-xs text-muted-foreground">
            Em breve — retiros via PIX
          </p>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href={routes.dashboardListings}
          label="Anúncios ativos"
          value={String(stats.activeListings)}
          hint={`${stats.listings} no total`}
          icon={StoreIcon}
        />
        <StatCard
          href={routes.dashboardSales}
          label="Entregas pendentes"
          value={String(stats.salesPending)}
          hint={`${stats.salesCompleted} vendas concluídas`}
          icon={PackageIcon}
        />
        <StatCard
          href={routes.dashboardPurchases}
          label="Compras abertas"
          value={String(stats.purchasesOpen)}
          hint="Pedidos em andamento"
          icon={ShoppingBagIcon}
        />
        <StatCard
          href={routes.dashboardMessages}
          label="Conversas"
          value={String(stats.conversations)}
          hint="Mensagens dos pedidos"
          icon={MessageSquareIcon}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          href={routes.dashboardVerification}
          icon={
            verified ? (
              <BadgeCheckIcon className="size-5 text-emerald-400" />
            ) : (
              <AlertTriangleIcon className="size-5 text-amber-400" />
            )
          }
          title={verified ? "Conta verificada" : "Conta não verificada"}
          body={
            verified
              ? "Documentos aprovados — mais confiança nas vendas."
              : "Complete a verificação para vender com mais confiança."
          }
        />
        <InfoCard
          href={routes.dashboardSales}
          icon={<ClockIcon className="size-5 text-sky-400" />}
          title="Prazos de entrega"
          body="Entregue pedidos pagos a tempo para manter boa reputação."
        />
        <InfoCard
          href={routes.dashboardNotifications}
          icon={<BellIcon className="size-5 text-primary" />}
          title="Alertas importantes"
          body="Avisos de pedidos, escrow e mensagens aparecerão aqui."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 p-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <PlusCircleIcon className="size-5" />
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <h3 className="font-semibold tracking-tight">Comece a vender</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              Publique um anúncio com entrega manual ou automática e proteção
              por escrow.
            </p>
          </div>
          <Link
            href={routes.sell}
            className={cn(buttonVariants({ size: "sm" }), "w-fit")}
          >
            Anunciar agora
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-card/40 p-5">
          <div className="flex size-10 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="flex flex-col items-center justify-center gap-1 max-w-xs text-center">
            <h3 className="font-semibold tracking-tight">Segurança garantida</h3>
            <p className="text-sm text-muted-foreground">
              O pagamento fica bloqueado até a entrega ser confirmada — comprador
              e vendedor protegidos.
            </p>
          </div>
          <Link
            href={routes.howItWorks}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit",
            )}
          >
            Entender proteção
          </Link>
        </div>
      </div>
    </div>
  );
};

function StatCard({ href, label, value, hint, icon: Icon, }: { href: string; label: string; value: string; hint: string; icon: typeof StoreIcon; }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card/70"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {label}
        </p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
};

function InfoCard({ href, icon, title, body, }: { href: string; icon: ReactNode; title: string; body: string; }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted/50">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">
          {body}
        </span>
      </span>
    </Link>
  );
};