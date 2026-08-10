"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  url: string;
};

type Props = {
  media: MediaItem[];
  fallback: { gradient: string; label: string };
  className?: string;
};

export function ListingImageSlider({ media, fallback, className }: Props) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    loop: media.length > 1,
    slideChanged(s) {
      setCurrent(s.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  const [thumbRef, thumbInstanceRef] = useKeenSlider<HTMLDivElement>({
    initial: 0,
    slides: {
      perView: Math.min(media.length, 5),
      spacing: 8,
    },
  });

  useEffect(() => {
    thumbInstanceRef.current?.moveToIdx(current);
  }, [current, thumbInstanceRef]);

  if (media.length === 0) {
    return (
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-md border border-border/60",
          className,
        )}
        style={{ background: fallback.gradient }}
      >
        <div className="flex size-full items-center justify-center">
          <span className="px-4 text-center text-sm font-medium text-white/70">
            {fallback.label}
          </span>
        </div>
      </div>
    );
  }

  const canNavigate = media.length > 1;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-border/60 bg-muted/30">
        <div ref={sliderRef} className="keen-slider size-full">
          {media.map((item) => (
            <div key={item.id} className="keen-slider__slide size-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="size-full object-cover select-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />

        {loaded && canNavigate ? (
          <>
            <button
              type="button"
              aria-label="Imagem anterior"
              onClick={() => instanceRef.current?.prev()}
              className="absolute top-1/2 left-2 z-[1] flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Próxima imagem"
              onClick={() => instanceRef.current?.next()}
              className="absolute top-1/2 right-2 z-[1] flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/75"
            >
              <ChevronRightIcon className="size-5" />
            </button>
            <span className="absolute right-3 bottom-3 z-[1] rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums backdrop-blur-sm">
              {current + 1}/{media.length}
            </span>
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <div ref={thumbRef} className="keen-slider">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => instanceRef.current?.moveToIdx(index)}
              className={cn(
                "keen-slider__slide relative aspect-video overflow-hidden rounded-md border bg-muted transition-colors",
                index === current
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border/60 hover:border-primary/40",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="size-full object-cover select-none"
                draggable={false}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
