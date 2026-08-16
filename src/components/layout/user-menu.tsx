"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { ChevronDownIcon, LogOutIcon, UserIcon, } from "lucide-react";
import { FaBasketShopping, FaArrowTrendUp, FaMoon, FaHeart } from "react-icons/fa6";
import { BiSolidUser } from "react-icons/bi";
import { IoLogOut } from "react-icons/io5";

import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import type { User } from "@/types/api";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  user: User;
  onLogout: () => void;
};

export function UserMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = user.name?.trim() || user.email;
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "max-w-[11rem] border-border bg-background px-2 h-10 hover:border-border/70 hover:bg-background/50",
        )}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserIcon className="size-3.5" />
          </span>
        )}
        <span className="truncate text-[13px]">{label}</span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </Button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute select-none top-[calc(100%+0.5rem)] right-0 z-50 w-56 overflow-hidden rounded-md border border-border/80 bg-background text-popover-foreground shadow-lg animate-rise duration-300 ease-in-out"
        >
          <div className="p-1.5">
            <MenuLink
              href={routes.dashboard}
              icon={BiSolidUser}
              onClick={() => setOpen(false)}
            >
              Minha Conta
            </MenuLink>
            <MenuLink
              href={routes.orders}
              icon={FaBasketShopping}
              onClick={() => setOpen(false)}
            >
              Minhas Compras
            </MenuLink>
            <MenuLink
              href="/dashboard/favorites"
              icon={FaHeart}
              onClick={() => setOpen(false)}
            >
              Meus Favoritos
            </MenuLink>
            <MenuLink
              href={routes.wallet}
              icon={FaArrowTrendUp}
              onClick={() => setOpen(false)}
            >
              Minhas Vendas
            </MenuLink>

            <div
              role="menuitem"
              aria-label="Alternar tema escuro"
              className="flex items-center justify-between gap-2 rounded-sm cursor-pointer select-none px-2.5 py-2 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                if (mounted) {
                  setTheme(isDark ? "light" : "dark");
                }
              }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <span className="inline-flex items-center gap-2">
                <FaMoon className="size-4 text-muted-foreground" />
                Tema escuro
              </span>
              <Switch
                size="default"
                checked={isDark}
                disabled={!mounted}
                onCheckedChange={(checked) => {
                  setTheme(checked ? "dark" : "light");
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Alternar tema escuro"
              />
            </div>
          </div>

          <div className="border-t border-border/70 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center cursor-pointer gap-2 rounded-sm px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOutIcon className="size-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, icon: Icon, onClick, children, }: { href: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; children: React.ReactNode; }) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center cursor-pointer gap-2 rounded-sm px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
    >
      <Icon className="size-4 text-muted-foreground" />
      {children}
    </Link>
  );
}
