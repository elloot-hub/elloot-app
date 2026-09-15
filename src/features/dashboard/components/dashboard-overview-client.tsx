"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BellIcon, MessageSquareIcon, PackageIcon, ShieldCheckIcon, ShoppingBagIcon, StoreIcon, TriangleAlertIcon, } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DashboardActionQueue } from "@/features/dashboard/components/action-queue";
import { DashboardFinanceStrip } from "@/features/dashboard/components/dashboard-finance-strip";
import { DashboardQuickLinks } from "@/features/dashboard/components/dashboard-quick-links";
import { DashboardSalesPulse } from "@/features/dashboard/components/dashboard-sales-pulse";
import { ListingHealthCard } from "@/features/dashboard/components/listing-health-card";
import { DashboardKycBanner, DashboardOverviewOnboarding, } from "@/features/dashboard/components/role-block";
import { hasFinanceSurface, resolveDashboardProfile, shouldShowKycBanner, } from "@/features/dashboard/dashboard-profile";
import { useDashboardSummary } from "@/features/dashboard/context/dashboard-summary-context";
import { OverviewSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import type { DashboardNavCounts, DashboardSummaryStats, } from "@/features/dashboard/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ACTION_LIMIT = 5;

const EMPTY_STATS: DashboardSummaryStats = {
  balanceCents: 0,
  pendingReleaseCents: 0,
  releasesTodayCents: 0,
  releasesUpcomingCents: 0,
  inDisputeCents: 0,
  pendingPayoutCents: 0,
  listingsTotal: 0,
  activeListings: 0,
  listingsPendingReview: 0,
  listingsRejected: 0,
  salesPending: 0,
  salesCompleted: 0,
  purchasesOpen: 0,
  purchasesCompleted: 0,
  conversations: 0,
  kycStatus: "NONE",
};

export function DashboardOverviewClient() {
  const { summary, loading, error } = useDashboardSummary();
  const stats = summary?.stats ?? EMPTY_STATS;
  const counts = summary?.counts;
  const actions = summary?.actions ?? [];

  const profile = useMemo(
    () => resolveDashboardProfile(stats, actions),
    [stats, actions],
  );

  const showSellerSurface = profile === "seller-only" || profile === "hybrid" || stats.listingsTotal > 0 || stats.salesCompleted > 0 || stats.salesPending > 0;
  const showBuyerSurface = profile === "buyer-only" || profile === "hybrid" || stats.purchasesOpen > 0 || stats.purchasesCompleted > 0;

  const showFinance = hasFinanceSurface(stats);
  const visibleActions = actions.slice(0, ACTION_LIMIT);
  const hasMoreActions = actions.length > ACTION_LIMIT;

  if (loading && !summary) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {profile === "new" ? (
        <>
          <DashboardOverviewOnboarding />
          <InsightGrid
            stats={stats}
            counts={counts}
            showBuyerSurface={false}
            showSellerSurface={false}
            isNew
          />
          <SecurityCard />
        </>
      ) : (
        <>
          <DashboardFinanceStrip stats={stats} /> 

          <InsightGrid
            stats={stats}
            counts={counts}
            showBuyerSurface={showBuyerSurface}
            showSellerSurface={showSellerSurface}
            hideKycCard={shouldShowKycBanner(stats)}
          />

          {shouldShowKycBanner(stats) ? (<DashboardKycBanner kycStatus={stats.kycStatus} />) : null}

          {/* <DashboardActionQueue
            actions={visibleActions}
            totalCount={actions.length}
            viewAllHref={
              hasMoreActions
                ? actions.some((a) => a.role === "buyer")
                  ? routes.dashboardPurchases
                  : routes.dashboardSales
                : undefined
            }
            loading={loading && !summary}
            emptyTitle="Tudo em dia"
            emptyBody="Nenhuma pendência no momento. Novas ações aparecem aqui."
          /> */}

          {/* {showBuyerSurface ? (
            <ActivitySection
              title="Suas compras"
              href={routes.dashboardPurchases}
              linkLabel="Ver compras"
            >
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-3">
                <MetricTile
                  href={routes.dashboardPurchases}
                  label="Em andamento"
                  value={String(stats.purchasesOpen)}
                  hint="Aguardando pagamento, entrega ou confirmação"
                  icon={ShoppingBagIcon}
                />
                <MetricTile
                  href={routes.dashboardPurchases}
                  label="Concluídas"
                  value={String(stats.purchasesCompleted)}
                  hint="Pedidos finalizados"
                  icon={PackageIcon}
                />
                <MetricTile
                  href={routes.dashboardMessages}
                  label="Mensagens"
                  colSpan={2}
                  value={String(counts?.messages ?? 0)}
                  hint={
                    stats.conversations > 0
                      ? `${stats.conversations} conversa(s) no total`
                      : "Chat dos pedidos"
                  }
                  icon={MessageSquareIcon}
                />
              </div>
            </ActivitySection>
          ) : null} */}

          {showSellerSurface ? (
            <ActivitySection
              title="Suas vendas"
              href={routes.dashboardSales}
              linkLabel="Ver vendas"
            >
              <div className="space-y-3">
                <DashboardSalesPulse />
                {/* <ListingHealthCard stats={stats} /> */}
              </div>
            </ActivitySection>
          ) : null}

          <SecurityCard />

          {profile === "buyer-only" ? <SellCta /> : null}
        </>
      )}
    </div>
  );
}

type InsightCard = {
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: "warn" | "ok" | "info";
  colSpan?: 2;
};

function InsightGrid({ stats, counts, showBuyerSurface, showSellerSurface, isNew, hideKycCard, }: { stats: DashboardSummaryStats; counts?: DashboardNavCounts; showBuyerSurface: boolean; showSellerSurface: boolean; isNew?: boolean; hideKycCard?: boolean; }) {
  const kycOk = stats.kycStatus === "APPROVED";
  const cards: InsightCard[] = [];

  if (!kycOk && !hideKycCard) {
    cards.push({
      href: routes.dashboardVerification,
      icon: TriangleAlertIcon,
      colSpan: 2,
      title: stats.kycStatus === "PENDING" ? "Verificação em análise" : stats.kycStatus === "REJECTED" ? "Verificação recusada" : "Conta não verificada",
      body: "Complete seus dados para sacar o saldo. Anunciar não exige verificação.",
      tone: "warn",
    });
  }

  if (showSellerSurface) {
    cards.push({
      href: routes.dashboardSales,
      icon: PackageIcon,
      title: "Prazos de entrega",
      body: stats.salesPending > 0 ? `${stats.salesPending} pedido(s) aguardando entrega.` : "Nenhuma entrega pendente no momento.",
      tone: stats.salesPending > 0 ? "warn" : "ok",
    });
  } else if (showBuyerSurface) {
    cards.push({
      href: routes.dashboardPurchases,
      icon: ShoppingBagIcon,
      title: "Compras em aberto",
      body: stats.purchasesOpen > 0 ? `${stats.purchasesOpen} compra(s) pedem sua atenção.` : "Nenhuma compra em andamento.",
      tone: stats.purchasesOpen > 0 ? "info" : "ok",
    });
  } else if (isNew) {
    cards.push({
      href: routes.howItWorks,
      icon: ShieldCheckIcon,
      title: "Compra protegida",
      body: "O valor fica retido até você confirmar a entrega.",
      tone: "ok",
    });
  }

  cards.push({
    href: routes.dashboardNotifications,
    icon: BellIcon,
    title: "Alertas importantes",
    body: (counts?.notifications ?? 0) > 0 ? `${counts!.notifications} notificação(ões) não lida(s).` : "Pagamentos, entregas e suporte ficam centralizados aqui.",
    tone: (counts?.notifications ?? 0) > 0 ? "info" : "ok",
  });

  const visibleCards = cards.slice(0, 3);
  const hasColSpan = visibleCards.some((card) => card.colSpan === 2);

  return (
    <div
      className={cn(
        "grid gap-2",
        hasColSpan ? "grid-cols-2" : "",
        visibleCards.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {visibleCards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className={cn(
            "rounded-md border p-3.5 transition-colors hover:border-primary/35",
            card.tone === "warn"
              ? "border-amber-500/30 bg-amber-500/5"
              : "border-border/60 bg-card/40",
            card.colSpan === 2 && "col-span-1 sm:col-span-1",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                card.tone === "warn"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "bg-primary/10 text-primary",
              )}
            >
              <card.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                {card.body}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ActivitySection({ title, href, linkLabel, children, }: { title: string; href: string; linkLabel: string; children: ReactNode; }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  );
};

function MetricTile({ href, label, value, hint, icon: Icon, colSpan, }: { href: string; label: string; value: string; hint: string; icon: LucideIcon; colSpan?: 2; }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md border border-border/60 bg-card/40 p-3.5 transition-colors hover:border-primary/35",
        colSpan === 2 && "col-span-2",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground text-pretty">{hint}</p>
    </Link>
  );
};

function SellCta() {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-card/20 p-4 text-center">
      <p className="text-sm font-medium">Quer vender no Elloot?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Crie seu primeiro anúncio e receba com proteção escrow.
      </p>
      <Link
        href={routes.sell}
        className={cn(buttonVariants({ size: "sm" }), "mt-3")}
      >
        Criar primeiro anúncio
      </Link>
    </div>
  );
};

function SecurityCard() {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <ShieldCheckIcon className="size-6 shrink-0 text-emerald-500" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Pagamento protegido pela Elloot</p>
          <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
            O valor fica retido até a entrega ser confirmada — comprador e
            vendedor protegidos.
          </p>
          <Link
            href={routes.howItWorks}
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "mt-1 h-auto px-0",
            )}
          >
            Entender proteção
          </Link>
        </div>
      </div>
    </div>
  );
};