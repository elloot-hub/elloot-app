"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { marketCategoryHref } from "@/features/catalog/market-path";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  className?: string;
};

export function CategoryCarousel({ categories, className }: Props) {
  if (categories.length === 0) return null;

  const loop = [...categories, ...categories];

  return (
    <div
      className={cn(
        "relative z-10 border-y border-border/40 bg-background/30 backdrop-blur-sm",
        className,
      )}
    >
      <Container className="flex flex-col gap-2.5 py-3 sm:py-3.5">
        <div className="group relative overflow-hidden">
          <div className="flex w-max gap-2.5 animate-category-marquee group-hover:[animation-play-state:paused] sm:gap-3">
            {loop.map((category, index) => {
              const visual = getCategoryVisual(category.slug);
              const Icon = visual.Icon;
              return (
                <Link
                  key={`${category.id}-${index}`}
                  href={marketCategoryHref(category)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-muted/40 py-1.5 pr-3.5 pl-1.5",
                    "text-sm text-muted-foreground transition-colors",
                    "hover:border-primary/35 hover:bg-primary/10 hover:text-foreground",
                  )}
                >
                  <span
                    className="flex size-7 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: visual.gradient }}
                  >
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt=""
                        className="size-full object-cover select-none pointer-events-none"
                      />
                    ) : (
                      <Icon
                        className="size-3.5"
                        style={{ color: visual.accent }}
                      />
                    )}
                  </span>
                  <span className="whitespace-nowrap font-medium tracking-tight">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
