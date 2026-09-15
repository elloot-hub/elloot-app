"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  HeartIcon,
  MessageSquareIcon,
  PackageIcon,
  ShoppingBagIcon,
  StoreIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import type { DashboardHomeProfile, DashboardRoleFilter } from "@/features/dashboard/dashboard-profile";
import type { DashboardNavCounts } from "@/features/dashboard/types";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type LinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type Props = {
  roleFilter: DashboardRoleFilter;
  profile: DashboardHomeProfile;
  counts?: DashboardNavCounts;
  className?: string;
};

function linksForFilter(
  roleFilter: DashboardRoleFilter,
  profile: DashboardHomeProfile,
  counts?: DashboardNavCounts,
): LinkItem[] {
  const buyerLinks: LinkItem[] = [
    {
      href: routes.dashboardPurchases,
      label: "Minhas compras",
      icon: ShoppingBagIcon,
      badge: counts?.purchases,
    },
    {
      href: routes.dashboardFavorites,
      label: "Favoritos",
      icon: HeartIcon,
    },
    {
      href: routes.dashboardMessages,
      label: "Mensagens",
      icon: MessageSquareIcon,
      badge: counts?.messages,
    },
  ];

  const sellerLinks: LinkItem[] = [
    {
      href: routes.dashboardSales,
      label: "Minhas vendas",
      icon: PackageIcon,
      badge: counts?.sales,
    },
    {
      href: routes.dashboardListings,
      label: "Meus anúncios",
      icon: StoreIcon,
      badge: counts?.listingsAttention,
    },
    {
      href: routes.dashboardWallet,
      label: "Carteira",
      icon: WalletIcon,
    },
    {
      href: routes.dashboardMetrics,
      label: "Métricas",
      icon: TrendingUpIcon,
    },
  ];

  if (roleFilter === "buyer") return buyerLinks;
  if (roleFilter === "seller") return sellerLinks;

  if (profile === "buyer-only") return buyerLinks;
  if (profile === "seller-only") return sellerLinks;

  return [
    buyerLinks[0],
    sellerLinks[0],
    sellerLinks[1],
    sellerLinks[2],
    buyerLinks[2],
  ];
}

export function DashboardQuickLinks({
  roleFilter,
  profile,
  counts,
  className,
}: Props) {
  const items = linksForFilter(roleFilter, profile, counts);

  return (
    <nav
      className={cn("space-y-2", className)}
      aria-label="Atalhos do painel"
    >
      <p className="text-sm font-semibold tracking-tight">Atalhos</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <item.icon className="size-3.5 shrink-0" />
            {item.label}
            {item.badge && item.badge > 0 ? (
              <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground tabular-nums">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
