"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { ListingCard } from "@/features/catalog/components/listing-card";
import type { ListingSummary } from "@/types/api";

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
      {canLeft ? (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Anterior"
          className="absolute top-1/2 left-0 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:left-1 sm:size-9"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      ) : null}
      {canRight ? (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Próximo"
          className="absolute top-1/2 right-0 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:right-1 sm:size-9"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="-mx-1 flex gap-3 overflow-x-auto scroll-smooth px-1 pb-1 pt-0.5 snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
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
  );
}
