"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ArrowRightIcon, ShoppingBagIcon } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight-new";
import { FlipWords } from "@/components/ui/flip-words";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { CategoryCarousel } from "@/features/catalog/components/category-carousel";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

const FLIP_WORDS = ["produtos", "contas", "itens", "skins", "outros"];

const SPOTLIGHT_DARK = {
  gradientFirst:
    "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(217, 91%, 70%, .07) 0, hsla(217, 91%, 54%, .025) 50%, hsla(217, 91%, 45%, 0) 80%)",
  gradientSecond:
    "radial-gradient(50% 50% at 50% 50%, hsla(217, 91%, 70%, .05) 0, hsla(217, 91%, 54%, .02) 80%, transparent 100%)",
  gradientThird:
    "radial-gradient(50% 50% at 50% 50%, hsla(217, 91%, 65%, .035) 0, hsla(217, 91%, 54%, .015) 80%, transparent 100%)",
} as const;

const SPOTLIGHT_LIGHT = {
  gradientFirst:
    "radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(217, 91%, 60%, .22) 0, hsla(217, 91%, 54%, .10) 50%, hsla(217, 91%, 45%, 0) 80%)",
  gradientSecond:
    "radial-gradient(50% 50% at 50% 50%, hsla(217, 91%, 58%, .16) 0, hsla(217, 91%, 54%, .06) 80%, transparent 100%)",
  gradientThird:
    "radial-gradient(50% 50% at 50% 50%, hsla(217, 91%, 55%, .12) 0, hsla(217, 91%, 54%, .04) 80%, transparent 100%)",
} as const;

export function HomeHero({ categories }: { categories: Category[] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme !== "light";
  const spot = isDark ? SPOTLIGHT_DARK : SPOTLIGHT_LIGHT;

  return (
    <section className="relative -mt-[var(--site-header-height)] overflow-hidden pt-[var(--site-header-height)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Spotlight {...spot} />
      </div>

      <Container className="relative z-10 flex min-h-[min(72vh,640px)] flex-col items-center justify-center py-16 text-center sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl space-y-4">
          <Badge variant="default">
            <p className="animate-rise font-heading tracking-wide">
              Comprar e vender
            </p>
          </Badge>

          <h1 className="animate-rise-delay font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            O lugar certo para comprar e vender{" "}
            <span className="inline-block text-primary">
              <FlipWords
                words={FLIP_WORDS}
                className="px-0 text-primary dark:text-primary"
              />
            </span>{" "}
            digitais
          </h1>

          <p className="animate-rise-delay-2 mx-auto max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            Contas, itens de jogos e muito mais. Compre com escrow ou anuncie e
            comece a lucrar — o pagamento só libera depois da entrega.
          </p>

          <div className="animate-rise-delay-2 flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href={routes.market}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Explorar ofertas
              <ArrowRightIcon />
            </Link>
            <Link
              href={routes.sell}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <ShoppingBagIcon />
              Começar a vender
            </Link>
          </div>
        </div>
      </Container>

      <CategoryCarousel categories={categories} />
    </section>
  );
}
