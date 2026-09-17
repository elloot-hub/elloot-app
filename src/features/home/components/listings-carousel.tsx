"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ListingCard } from "@/features/catalog/components/listing-card";
import type { ListingSummary } from "@/types/api";
import { cn } from "@/lib/utils";

type Props = {
  listings: ListingSummary[];
};

export function ListingsCarousel({ listings }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      ro.disconnect();
    };
  }, [listings.length, updateEdges]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.min(320, Math.round(el.clientWidth * 0.85));
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-1.5 sm:absolute sm:-top-14 sm:right-0 sm:mb-0">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Anterior"
          disabled={!canLeft}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-colors",
            canLeft
              ? "hover:bg-muted hover:text-foreground"
              : "cursor-default opacity-35",
          )}
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Próximo"
          disabled={!canRight}
          className={cn(
            "flex size-8 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-colors",
            canRight
              ? "hover:bg-muted hover:text-foreground"
              : "cursor-default opacity-35",
          )}
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <div className="relative">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-background to-transparent transition-opacity sm:w-10",
            canLeft ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-[1] w-6 bg-gradient-to-l from-background to-transparent transition-opacity sm:w-10",
            canRight ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          ref={scrollRef}
          className="-mx-1 flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 pt-1 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
        >
          {listings.map((listing, index) => (
            <div
              key={listing.id}
              className="w-[158px] shrink-0 snap-start sm:w-[200px] md:w-[220px]"
            >
              <ListingCard listing={listing} priority={index < 2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
