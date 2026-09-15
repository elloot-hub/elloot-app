"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MenuIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { HeaderSearch } from "@/features/catalog/components/header-search";
import { CategoriesModal } from "@/features/catalog/components/categories-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { NotificationsButton } from "@/components/layout/notifications-button";
import { MobileNavSheet } from "@/components/layout/mobile-nav-sheet";
import { CartButton, CartDrawer } from "@/features/cart";
import { UserMenu } from "@/components/layout/user-menu";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  // Hide-on-scroll temporariamente desligado para testar navbar fixa.
  // const [isVisible, setIsVisible] = useState(true);
  // const lastScrollY = useRef(0);
  // const ticking = useRef(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // useEffect(() => {
  //   function update() {
  //     const currentScrollY = window.scrollY;
  //     const goingDown = currentScrollY > lastScrollY.current;
  //     const goingUp = currentScrollY < lastScrollY.current;
  //
  //     setIsAtTop(currentScrollY <= 0);
  //
  //     if (currentScrollY <= 0 || menuOpen) {
  //       setIsVisible(true);
  //     } else if (goingDown && currentScrollY > 100) {
  //       setIsVisible(false);
  //     } else if (goingUp) {
  //       setIsVisible(true);
  //     }
  //
  //     lastScrollY.current = currentScrollY;
  //     ticking.current = false;
  //   }
  //
  //   function handleScroll() {
  //     if (ticking.current) return;
  //     ticking.current = true;
  //     window.requestAnimationFrame(update);
  //   }
  //
  //   update();
  //   window.addEventListener("scroll", handleScroll, { passive: true });
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, [menuOpen]);

  // Só atualiza o fundo/blur da navbar ao rolar (sem esconder).
  useEffect(() => {
    function update() {
      setIsAtTop(window.scrollY <= 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  function handleLogout() {
    logout();
    router.push(routes.home);
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 will-change-transform transition-transform duration-300 ease-out",
          // Hide-on-scroll: descomente a linha abaixo e remova `translate-y-0` fixo.
          // isVisible ? "translate-y-0" : "pointer-events-none -translate-y-full",
          "translate-y-0",
        )}
      >
        {!isAtTop ? (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 border-b border-border/50 bg-background/60 backdrop-blur-xl dark:border-white/5"
          />
        ) : null}

        <Container className="relative flex flex-col gap-0 md:h-[4.5rem] md:flex-row md:items-center md:gap-4">
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center md:flex md:h-full md:min-w-0 md:flex-1 md:grid-cols-none">
            <div className="flex items-center justify-start">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon className="size-5" />
              </Button>

              <Link
                href={routes.home}
                className="hidden shrink-0 outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
                aria-label="Elloot início"
              >
                <Image
                  src="/elloot-navbar.png"
                  alt="Elloot"
                  width={160}
                  height={36}
                  priority
                  className="h-9 w-auto"
                />
              </Link>
            </div>

            <Link
              href={routes.home}
              className="justify-self-center outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring md:hidden"
              aria-label="Elloot início"
            >
              <Image
                src="/elloot-navbar.png"
                alt="Elloot"
                width={140}
                height={32}
                priority
                className="h-8 w-auto"
              />
            </Link>

            <HeaderSearch className="hidden md:block md:min-w-0 md:flex-1" />

            <nav className="flex items-center justify-end gap-1.5 sm:gap-2">
              {loading && !user ? (
                <NavbarAuthSkeleton />
              ) : user ? (
                <>
                  <Link
                    href={routes.sell}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "hidden rounded-full md:inline-flex",
                    )}
                  >
                    Anunciar
                  </Link>
                  <NotificationsButton />
                  <UserMenu user={user} onLogout={handleLogout} />
                </>
              ) : (
                <Link
                  href={routes.login}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-full px-3 md:px-5",
                  )}
                >
                  <span className="md:hidden">Entrar</span>
                  <span className="hidden md:inline">Fazer login</span>
                </Link>
              )}

              <CartButton />
            </nav>
          </div>

          <div className="pb-3 md:hidden">
            <HeaderSearch />
          </div>
        </Container>
      </header>

      <MobileNavSheet
        open={menuOpen}
        onClose={closeMenu}
        user={user}
        onLogout={handleLogout}
        onOpenCategories={() => setCategoriesOpen(true)}
      />
      <CategoriesModal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
      <CartDrawer />
    </>
  );
}

function NavbarAuthSkeleton() {
  return (
    <div
      className="flex items-center gap-1.5 sm:gap-2"
      aria-busy="true"
      aria-label="Carregando conta"
    >
      <Skeleton className="hidden h-8 w-[5.75rem] rounded-full md:block" />
      <Skeleton className="size-8 rounded-full" />
      <div className="flex size-9 items-center justify-center md:h-10 md:w-auto md:gap-2 md:rounded-full md:border md:border-border/60 md:bg-background md:px-2">
        <Skeleton className="size-6 shrink-0 rounded-full" />
        <Skeleton className="hidden h-3 w-24 md:block" />
        <Skeleton className="hidden size-3.5 shrink-0 rounded-sm md:block" />
      </div>
    </div>
  );
}
