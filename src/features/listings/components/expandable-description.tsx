"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { renderListingDescription } from "@/features/listings/lib/listing-description-format";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Max collapsed height in px before showing "Ler mais". */
  collapsedMaxHeight?: number;
  className?: string;
};

export function ExpandableDescription({
  text,
  collapsedMaxHeight = 160,
  className,
}: Props) {
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      const prev = el.style.maxHeight;
      el.style.maxHeight = "none";
      const full = el.scrollHeight;
      el.style.maxHeight = prev;
      setNeedsToggle(full > collapsedMaxHeight + 8);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, collapsedMaxHeight]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <div
          id={contentId}
          ref={contentRef}
          className={cn(
            "text-sm leading-relaxed text-muted-foreground transition-[max-height] duration-300 ease-out",
            !expanded && needsToggle && "overflow-hidden",
          )}
          style={
            !expanded && needsToggle
              ? { maxHeight: collapsedMaxHeight }
              : undefined
          }
        >
          {renderListingDescription(text)}
        </div>
        {!expanded && needsToggle ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/95 via-background/70 to-transparent dark:from-background/90"
          />
        ) : null}
      </div>

      {needsToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center cursor-pointer gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? (
            <>
              Ver menos
              <ChevronUpIcon className="size-4" />
            </>
          ) : (
            <>
              Ler mais
              <ChevronDownIcon className="size-4" />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
