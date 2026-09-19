"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  HeartIcon,
  LayoutGridIcon,
  LogInIcon,
  StoreIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { FaArrowTrendUp, FaBasketShopping } from "react-icons/fa6";
import { Button, buttonVariants } from "@/components/ui/button";
import { loginHref, registerHref } from "@/features/auth/safe-next";
import type { User } from "@/types/api";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenCategories: () => void;
  /** Path atual para voltar após login. */
  authNext?: string | null;
};

export function MobileNavSheet({
  open,
  onClose,
  user,
  onLogout,
  onOpenCategories,
  authNext,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,20rem)] flex-col border-r border-border/60 bg-background p-4 shadow-xl animate-rise"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold tracking-tight">Menu</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          <SheetButton
            icon={LayoutGridIcon}
            onClick={() => {
              onClose();
              onOpenCategories();
            }}
          >
            Categorias
          </SheetButton>
          <SheetLink href={routes.sell} icon={StoreIcon} onClick={onClose}>
            Anunciar
          </SheetLink>

          <div className="my-2 border-t border-border/60" />

          {user ? (
            <>
              <SheetLink
                href={routes.dashboard}
                icon={UserIcon}
                onClick={onClose}
              >
                Minha conta
              </SheetLink>
              <SheetLink
                href={routes.orders}
                icon={FaBasketShopping}
                onClick={onClose}
              >
                Minhas compras
              </SheetLink>
              <SheetLink
                href={routes.dashboardFavorites}
                icon={HeartIcon}
                onClick={onClose}
              >
                Meus favoritos
              </SheetLink>
              <SheetLink
                href={routes.wallet}
                icon={FaArrowTrendUp}
                onClick={onClose}
              >
                Minhas vendas
              </SheetLink>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="mt-auto flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                Sair da conta
              </button>
            </>
          ) : (
            <>
              <SheetLink
                href={loginHref(authNext)}
                icon={LogInIcon}
                onClick={onClose}
              >
                Fazer login
              </SheetLink>
              <Link
                href={registerHref(authNext)}
                onClick={onClose}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "mt-2 h-10 w-full rounded-full",
                )}
              >
                Criar conta
              </Link>
            </>
          )}
        </nav>
      </aside>
    </div>
  );
}

function SheetLink({
  href,
  icon: Icon,
  onClick,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </Link>
  );
}

function SheetButton({
  icon: Icon,
  onClick,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </button>
  );
}
