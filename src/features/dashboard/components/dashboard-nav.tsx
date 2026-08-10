"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheckIcon, BanknoteIcon, BellIcon, ChevronDownIcon, HeartIcon, HelpCircleIcon, LayoutDashboardIcon, MenuIcon, MessageSquareIcon, PackageIcon, SettingsIcon, ShoppingBagIcon, StoreIcon, TrendingUpIcon, UserIcon, WalletIcon, XIcon, } from "lucide-react";
import { FaDiscord } from "react-icons/fa6";
import { useAuth } from "@/features/auth/context";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const DISCORD_URL = "https://discord.gg/";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  exact?: boolean;
  soon?: boolean;
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
        label: "Resumo",
        icon: LayoutDashboardIcon,
        exact: true,
      },
      {
        href: routes.dashboardNotifications,
        label: "Central de notificações",
        icon: BellIcon,
      },
    ],
  },
  {
    id: "buyer",
    label: "Compras",
    icon: ShoppingBagIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboardPurchases,
        label: "Minhas compras",
        icon: ShoppingBagIcon,
      },
      {
        href: routes.dashboardFavorites,
        label: "Meus favoritos",
        icon: HeartIcon,
      },
      {
        href: routes.dashboardMessages,
        label: "Mensagens",
        icon: MessageSquareIcon,
      },
    ],
  },
  {
    id: "seller",
    label: "Vendas",
    icon: TrendingUpIcon,
    defaultOpen: true,
    items: [
      {
        href: routes.dashboardListings,
        label: "Meus anúncios",
        icon: StoreIcon,
      },
      {
        href: routes.dashboardSales,
        label: "Minhas vendas",
        icon: PackageIcon,
      },
      {
        href: routes.dashboardMetrics,
        label: "Métricas",
        icon: TrendingUpIcon,
      },
      { href: routes.sell, label: "Criar anúncio", icon: StoreIcon },
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
        soon: true,
      },
    ],
  },
  {
    id: "account",
    label: "Conta",
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

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
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

function NavBody({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, s.defaultOpen ?? true])),
  );

  const displayName =
    user?.name?.trim()?.split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const greeting = getGreeting();

  const activeSectionId = useMemo(() => {
    for (const section of SECTIONS) {
      if (section.items.some((item) => isActive(pathname, item))) {
        return section.id;
      }
    }
    return null;
  }, [pathname]);

  useEffect(() => {
    if (!activeSectionId) return;
    setOpen((prev) =>
      prev[activeSectionId] ? prev : { ...prev, [activeSectionId]: true },
    );
  }, [activeSectionId]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="space-y-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3 px-1">
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
          const SectionIcon = section.icon;
          const sectionHasActive = section.items.some((item) =>
            isActive(pathname, item),
          );

          return (
            <div key={section.id} className="pb-1">
              <button
                type="button"
                onClick={() =>
                  setOpen((prev) => ({ ...prev, [section.id]: !expanded }))
                }
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  sectionHasActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <SectionIcon className="size-4 shrink-0 opacity-80" />
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
                    const active = isActive(pathname, item);
                    const Icon = item.icon;
                    return (
                      <li key={`${section.id}-${item.href}-${item.label}`}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "relative flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                            active
                              ? "bg-primary/10 text-primary before:absolute before:-left-[calc(0.5rem+1px)] before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-primary"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                          )}
                        >
                          <Icon className="size-3.5 shrink-0 opacity-80" />
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {item.soon ? (
                            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-muted-foreground uppercase">
                              Em breve
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
}

export function DashboardNav({ className }: { className?: string }) {
  return <NavBody className={className} />;
}

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
}