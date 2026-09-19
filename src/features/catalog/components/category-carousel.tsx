"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { KeenSliderPlugin } from "keen-slider";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { Container } from "@/components/layout/container";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { marketCategoryHref } from "@/features/catalog/market-path";
import { allowVerticalScroll } from "@/features/home/lib/keen-vertical-scroll";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  className?: string;
};

/** Auto-avança no modo free-snap; pausa no hover/drag. */
function AutoplayPlugin(intervalMs = 2800): KeenSliderPlugin {
  return (slider) => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let mouseOver = false;

    function clearNext() {
      if (timeout) clearTimeout(timeout);
    }

    function schedule() {
      clearNext();
      if (mouseOver) return;
      timeout = setTimeout(() => {
        slider.next();
      }, intervalMs);
    }

    slider.on("created", () => {
      slider.container.addEventListener("mouseover", () => {
        mouseOver = true;
        clearNext();
      });
      slider.container.addEventListener("mouseout", () => {
        mouseOver = false;
        schedule();
      });
      schedule();
    });
    slider.on("dragStarted", clearNext);
    slider.on("animationEnded", schedule);
    slider.on("updated", schedule);
    slider.on("destroyed", clearNext);
  };
}

export function CategoryCarousel({ categories, className }: Props) {
  const [mounted, setMounted] = useState(false);

  // Loop precisa de slides suficientes; duplica quando a lista é curta.
  const slides =
    categories.length > 0 && categories.length < 8
      ? [...categories, ...categories]
      : categories;

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: slides.length > 3,
      mode: "free-snap",
      rubberband: true,
      slides: {
        perView: "auto",
        spacing: 10,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: "auto", spacing: 12 },
        },
      },
      created() {
        setMounted(true);
      },
    },
    [allowVerticalScroll, AutoplayPlugin(2800)],
  );

  useEffect(() => {
    instanceRef.current?.update();
  }, [slides.length, instanceRef]);

  if (categories.length === 0) return null;

  return (
    <div
      className={cn(
        "relative z-10 border-y border-border/40 bg-background/30 backdrop-blur-sm",
        className,
      )}
    >
      <Container className="flex flex-col gap-2.5 py-3 sm:py-3.5">
        <div
          className={cn(
            "overflow-hidden transition-opacity",
            mounted ? "opacity-100" : "opacity-0",
          )}
        >
          <div ref={sliderRef} className="keen-slider touch-pan-y">
            {slides.map((category, index) => {
              const visual = getCategoryVisual(category.slug);
              const Icon = visual.Icon;
              return (
                <div
                  key={`${category.id}-${index}`}
                  className="keen-slider__slide !w-auto !min-w-fit !max-w-none"
                >
                  <Link
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.imageUrl}
                          alt=""
                          className="size-full object-cover select-none pointer-events-none"
                          draggable={false}
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
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
