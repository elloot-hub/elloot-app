"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { KeenSliderInstance } from "keen-slider";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { allowVerticalScroll } from "@/features/home/lib/keen-vertical-scroll";
import type { ListingSummary } from "@/types/api";

type Props = {
  listings: ListingSummary[];
};

function updateNav(
  slider: KeenSliderInstance,
  setCanLeft: (v: boolean) => void,
  setCanRight: (v: boolean) => void,
) {
  const d = slider.track.details;
  if (!d) {
    setCanLeft(false);
    setCanRight(false);
    return;
  }
  setCanLeft(d.progress > 0.02);
  setCanRight(d.progress < 0.98);
}

export function ListingsCarousel({ listings }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      mode: "free-snap",
      rubberband: true,
      slides: {
        perView: "auto",
        spacing: 12,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: "auto", spacing: 16 },
        },
      },
      created(s) {
        setLoaded(true);
        updateNav(s, setCanLeft, setCanRight);
      },
      slideChanged(s) {
        updateNav(s, setCanLeft, setCanRight);
      },
      updated(s) {
        updateNav(s, setCanLeft, setCanRight);
      },
      animationEnded(s) {
        updateNav(s, setCanLeft, setCanRight);
      },
    },
    [allowVerticalScroll],
  );

  useEffect(() => {
    instanceRef.current?.update();
  }, [listings, instanceRef]);

  if (listings.length === 0) return null;

  return (
    <div className="relative">
      {loaded && canLeft ? (
        <button
          type="button"
          onClick={() => instanceRef.current?.prev()}
          aria-label="Anterior"
          className="absolute top-1/2 left-0 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:left-1 sm:size-9"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
      ) : null}
      {loaded && canRight ? (
        <button
          type="button"
          onClick={() => instanceRef.current?.next()}
          aria-label="Próximo"
          className="absolute top-1/2 right-0 z-[2] flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted sm:right-1 sm:size-9"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      ) : null}

      <div ref={sliderRef} className="keen-slider touch-pan-y">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className="keen-slider__slide !min-w-[158px] !max-w-[158px] sm:!min-w-[200px] sm:!max-w-[200px] md:!min-w-[220px] md:!max-w-[220px]"
          >
            <ListingCard listing={listing} priority={index < 2} />
          </div>
        ))}
      </div>
    </div>
  );
}
