"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { HeaderSearch } from "@/features/catalog/components/header-search";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { NotificationsButton } from "@/components/layout/notifications-button";
import { CartButton, CartDrawer } from "@/features/cart";
import { UserMenu } from "@/components/layout/user-menu";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    function update() {
      const currentScrollY = window.scrollY;
      const goingDown = currentScrollY > lastScrollY.current;
      const goingUp = currentScrollY < lastScrollY.current;

      setIsAtTop(currentScrollY <= 0);

      if (currentScrollY <= 0) {
        setIsVisible(true);
      } else if (goingDown && currentScrollY > 100) {
        setIsVisible(false);
      } else if (goingUp) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    }

    function handleScroll() {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 will-change-transform transition-transform duration-300 ease-out",
          isVisible ? "translate-y-0" : "pointer-events-none -translate-y-full",
        )}
      >
        {!isAtTop ? (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 border-b border-border/50 bg-background/60 backdrop-blur-xl dark:border-white/5"
          />
        ) : null}

        <Container className="relative flex h-[4.25rem] items-center gap-3 sm:h-[4.5rem] sm:gap-4">
          <Link
            href={routes.home}
            className="shrink-0 outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Elloot início"
          >
            <Image
              src="/elloot-navbar.png"
              alt="Elloot"
              width={160}
              height={36}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </Link>

          <HeaderSearch className="hidden md:block" />

          <nav className="ml-auto flex items-center gap-2">
            {user ? (
              <Link
                href={routes.sell}
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "hidden rounded-full sm:inline-flex",
                )}
              >
                Anunciar
              </Link>
            ) : null}
            {user ? <NotificationsButton /> : null}

            {loading ? (
              <span className="w-14 text-xs text-muted-foreground">…</span>
            ) : user ? (
              <UserMenu
                user={user}
                onLogout={() => {
                  logout();
                  router.push(routes.home);
                }}
              />
            ) : (
              <Link
                href={routes.login}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full px-5",
                )}
              >
                Fazer login
              </Link>
            )}

            <CartButton />
          </nav>
        </Container>
      </header>

      <CartDrawer />
    </>
  );
}
