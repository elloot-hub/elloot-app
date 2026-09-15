"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheckIcon, BadgePlus, BanknoteIcon, BellIcon, ChartNoAxesColumn, ChartNoAxesCombined, ChevronDownIcon, CircleQuestionMark, HeartIcon, LayoutDashboardIcon, MenuIcon, MessageCircleIcon, MessageSquareIcon, MessageSquareText, PackageIcon, SettingsIcon, ShoppingBagIcon, ShoppingBasket, StarIcon, StoreIcon, TrendingUpIcon, UserIcon, WalletIcon, XIcon, } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { NavBadge } from "@/features/dashboard/components/nav-badge";
import { useDashboardSummaryOptional } from "@/features/dashboard/context/dashboard-summary-context";
import { hasSellerSurface } from "@/features/dashboard/dashboard-profile";
import type { DashboardNavCountKey } from "@/features/dashboard/types";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  exact?: boolean;
  soon?: boolean;
  new?: boolean;
  beta?: boolean;
  countKey?: DashboardNavCountKey;
};

type NavSection = {
  id: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  items: NavItem[];
  defaultOpen?: boolean;
};

const SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Visão geral",
    icon: LayoutDashboardIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboard,
        label: "Resumo Geral",
        icon: LayoutDashboardIcon,
        exact: true,
      },
      {
        href: routes.dashboardNotifications,
        label: "Notificações",
        icon: BellIcon,
        countKey: "notifications",
        new: true,
      },
      {
        href: routes.dashboardMessages,
        label: "Elloot Chat",
        icon: MessageSquareText,
        countKey: "messages",
        beta: true,
      },
    ],
  },
  {
    id: "buyer",
    label: "Minhas Compras",
    icon: ShoppingBagIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboardPurchases,
        label: "Minhas compras",
        icon: ShoppingBasket,
        countKey: "purchases",
      },
      {
        href: routes.dashboardFavorites,
        label: "Meus favoritos",
        icon: HeartIcon,
      },
      {
        href: routes.dashboardQuestionsMine,
        label: "Minhas perguntas",
        icon: CircleQuestionMark,
      },
      {
        href: routes.dashboardReviewsMine,
        label: "Minhas avaliações",
        icon: StarIcon,
      },
    ],
  },
  {
    id: "seller",
    label: "Minhas Vendas",
    icon: TrendingUpIcon,
    defaultOpen: true,
    items: [
      { href: routes.sell, label: "Criar anúncio", icon: BadgePlus },
      {
        href: routes.dashboardListings,
        label: "Meus anúncios",
        icon: StoreIcon,
        countKey: "listingsAttention",
      },
      {
        href: routes.dashboardSales,
        label: "Minhas vendas",
        icon: PackageIcon,
        countKey: "sales",
      },
      {
        href: routes.dashboardMetricsTab("overview"),
        label: "Métricas de Vendas",
        icon: ChartNoAxesCombined,
        beta: true,
      },
      {
        href: routes.dashboardQuestionsReceived,
        label: "Perguntas recebidas",
        icon: MessageCircleIcon,
        countKey: "questionsReceived",
      },
      {
        href: routes.dashboardReviews,
        label: "Avaliações recebidas",
        icon: StarIcon,
      },
    ],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: WalletIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboardWallet,
        label: "Extrato / saldo",
        icon: WalletIcon,
      },
      {
        href: routes.dashboardWithdrawals,
        label: "Minhas retiradas",
        icon: BanknoteIcon,
      },
    ],
  },
  {
    id: "account",
    label: "Minha Conta",
    icon: SettingsIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboardSettings,
        label: "Configurações",
        icon: SettingsIcon,
      },
      {
        href: routes.dashboardVerification,
        label: "Verificação",
        icon: BadgeCheckIcon,
      },
    ],
  },
];

const NAV_OPEN_STORAGE_PREFIX = "elloot.dashboard.nav.open.v1:";

function navOpenStorageKey(userId: string) {
  return `${NAV_OPEN_STORAGE_PREFIX}${userId}`;
}

function defaultNavOpenState(isSeller: boolean): Record<string, boolean> {
  return Object.fromEntries(
    SECTIONS.map((section) => {
      if (!isSeller && (section.id === "seller" || section.id === "finance")) {
        return [section.id, false];
      }
      return [section.id, section.defaultOpen ?? true];
    }),
  );
}

function loadNavOpenState(userId: string): Record<string, boolean> | null {
  try {
    const raw = window.localStorage.getItem(navOpenStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const next: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") next[key] = value;
    }
    return Object.keys(next).length > 0 ? next : null;
  } catch {
    return null;
  }
}

function saveNavOpenState(userId: string, open: Record<string, boolean>) {
  try {
    window.localStorage.setItem(navOpenStorageKey(userId), JSON.stringify(open));
  } catch {
    /* ignore quota / private mode */
  }
}

function hrefPath(href: string) {
  return href.split("?")[0] ?? href;
}

function pathMatchesItem(pathname: string, item: NavItem) {
  const path = hrefPath(item.href);
  if (item.exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isActive(pathname: string, item: NavItem, candidates: NavItem[]) {
  if (!pathMatchesItem(pathname, item)) return false;
  const matches = candidates.filter((candidate) =>
    pathMatchesItem(pathname, candidate),
  );
  const best = matches.reduce((a, b) =>
    hrefPath(a.href).length >= hrefPath(b.href).length ? a : b,
  );
  return hrefPath(best.href) === hrefPath(item.href);
}

function sellerInitial(name: string | null | undefined, email?: string) {
  const n = name?.trim();
  if (n) return n.charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return "?";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  if (hour >= 18 && hour < 23) return "Boa noite";
  return "Boa madrugada";
}

function NavBody({ onNavigate, className, }: { onNavigate?: () => void; className?: string; }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const summaryCtx = useDashboardSummaryOptional();
  const navCounts = summaryCtx?.summary?.counts;
  const stats = summaryCtx?.summary?.stats;

  const isSeller = stats ? hasSellerSurface(stats) : null;

  const navItems = useMemo(
    () => SECTIONS.flatMap((s) => s.items),
    [],
  );

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    defaultNavOpenState(true),
  );

  useEffect(() => {
    if (!user?.id) return;

    const saved = loadNavOpenState(user.id);
    if (saved) {
      setOpen({ ...defaultNavOpenState(isSeller ?? true), ...saved });
      return;
    }

    if (isSeller === null) return;
    setOpen(defaultNavOpenState(isSeller));
  }, [user?.id, isSeller]);

  function setSectionOpen(updater: (prev: Record<string, boolean>) => Record<string, boolean>) {
    setOpen((prev) => {
      const next = updater(prev);
      if (user?.id) saveNavOpenState(user.id, next);
      return next;
    });
  }

  const displayName = user?.name?.trim()?.split(/\s+/)[0] || user?.email?.split("@")[0] || "Usuário";
  const greeting = getGreeting();

  const activeSectionId = useMemo(() => {
    for (const section of SECTIONS) {
      if (section.items.some((item) => isActive(pathname, item, navItems))) {
        return section.id;
      }
    }
    return null;
  }, [pathname, navItems]);

  useEffect(() => {
    if (!activeSectionId) return;
    setSectionOpen((prev) =>
      prev[activeSectionId] ? prev : { ...prev, [activeSectionId]: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to route-driven section
  }, [activeSectionId, user?.id]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="space-y-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3 px-1">
          {loading && !user ? (
            <>
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </>
          ) : (
            <>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-11 rounded-full object-cover ring-1 ring-border/60"
                />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {sellerInitial(user?.name, user?.email)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {greeting}, {displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bem-vindo ao painel
                </p>
              </div>
            </>
          )}
        </div>
        <Link
          href={routes.dashboardSettings}
          onClick={onNavigate}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 w-full justify-start gap-2 rounded-md",
          )}
        >
          <UserIcon className="size-3.5" />
          Ver meu perfil
        </Link>
      </div>

      <nav className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {SECTIONS.map((section) => {
          const expanded = open[section.id] ?? true;
          const sectionHasActive = section.items.some((item) =>
            isActive(pathname, item, navItems),
          );

          return (
            <div key={section.id} className="pb-1">
              <button
                type="button"
                onClick={() =>
                  setSectionOpen((prev) => ({
                    ...prev,
                    [section.id]: !expanded,
                  }))
                }
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  sectionHasActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-left">
                  {section.label}
                </span>
                <ChevronDownIcon
                  className={cn(
                    "size-3.5 shrink-0 transition-transform",
                    expanded ? "rotate-0" : "-rotate-90",
                  )}
                />
              </button>

              {expanded ? (
                <ul className="relative ml-4 space-y-0.5 border-l border-border/60 pl-2">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item, navItems);
                    return (
                      <li key={`${section.id}-${item.href}-${item.label}`}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "relative flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary before:absolute before:-left-[calc(0.5rem+1px)] before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-primary"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          <div className="size-4 shrink-0">
                            <item.icon className="size-4" />
                          </div>
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {item.countKey && navCounts ? (
                            <NavBadge
                              count={navCounts[item.countKey]}
                              label={`${navCounts[item.countKey]} pendências em ${item.label}`}
                            />
                          ) : null}
                          {item.soon ? (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                              Em breve
                            </span>
                          ) : null}
                          {item.beta ? (
                            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                              BETA
                            </span>
                          ) : null}
                          {item.new ? (
                            <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white uppercase">
                              NOVO
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export function DashboardNav({ className }: { className?: string }) {
  return <NavBody className={className} />;
};

export function DashboardMobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants({ variant: "secondary", size: "sm" }),
          "h-9 gap-2 rounded-md lg:hidden",
        )}
      >
        <MenuIcon className="size-4" />
        Menu
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100vw-2.5rem,20rem)] flex-col border-r border-border/60 bg-background p-4 shadow-xl animate-rise">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold tracking-tight">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                aria-label="Fechar"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <NavBody
              onNavigate={() => setOpen(false)}
              className="min-h-0 flex-1"
            />
          </aside>
        </div>
      ) : null}
    </>
  );
};