"use client";

import { useMemo, useRef, useState } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type SearchableSelectOption = {
  value: string;
  label: string;
  iconUrl?: string | null;
};

type Props = {
  value?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  searchThreshold?: number;
  emptyText?: string;
  id?: string;
};

const ITEM_HEIGHT = 40;
const LIST_MAX_HEIGHT = 256;
const VIRTUALIZE_AT = 30;
/** Alinha com `duration-100` do PopoverContent. */
const CLOSE_MS = 110;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function SearchableSelect({ value, onValueChange, options, placeholder = "Selecione", searchPlaceholder = "Buscar…", disabled, className, searchThreshold = 8, emptyText = "Nenhuma opção encontrada.", id, }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showSearch = options.length >= searchThreshold;

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query]);

  const virtualize = filtered.length >= VIRTUALIZE_AT;
  const startIndex = virtualize
    ? Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 3)
    : 0;
  const visibleCount = virtualize
    ? Math.ceil(LIST_MAX_HEIGHT / ITEM_HEIGHT) + 6
    : filtered.length;
  const endIndex = Math.min(filtered.length, startIndex + visibleCount);
  const visible = virtualize
    ? filtered.slice(startIndex, endIndex)
    : filtered;

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function selectOption(next: string) {
    clearCloseTimer();
    setOpen(false);
    setQuery("");
    setScrollTop(0);
    // Espera o animate-out terminar antes do re-render pesado do formulário.
    closeTimer.current = setTimeout(() => {
      onValueChange(next);
      closeTimer.current = null;
    }, CLOSE_MS);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearCloseTimer();
        setOpen(next);
        if (!next) {
          setQuery("");
          setScrollTop(0);
        }
      }}
    >
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-input/30 dark:hover:bg-input/50",
          !selected && "text-muted-foreground",
          className,
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
          {selected?.iconUrl ? (
            <img
              src={selected.iconUrl}
              alt=""
              className="size-7 shrink-0 rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <span className="truncate">
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--anchor-width) min-w-[var(--anchor-width)] gap-0 overflow-hidden rounded-md p-0 shadow-md border-border"
        style={{ width: "var(--anchor-width)" }}
      >
        {showSearch ? (
          <div className="sticky top-0 z-10 border-b border-border/60 bg-background/20 backdrop-blur-md p-2">
            <label className="relative block">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setScrollTop(0);
                }}
                placeholder={searchPlaceholder}
                autoFocus
                className="h-10 w-full rounded-md pr-3 pl-10 text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>
        ) : null}

        <div
          className="max-h-64 overflow-y-auto overscroll-contain p-1.5"
          onScroll={
            virtualize
              ? (e) => setScrollTop(e.currentTarget.scrollTop)
              : undefined
          }
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            <ul
              className={cn(
                "flex flex-col",
                virtualize ? "relative" : "gap-0.5",
              )}
              role="listbox"
              style={
                virtualize
                  ? { height: filtered.length * ITEM_HEIGHT }
                  : undefined
              }
            >
              {visible.map((option, i) => {
                const isSelected = option.value === value;
                const index = virtualize ? startIndex + i : i;
                return (
                  <li
                    key={option.value}
                    style={
                      virtualize
                        ? {
                            position: "absolute",
                            top: index * ITEM_HEIGHT,
                            left: 0,
                            right: 0,
                            height: ITEM_HEIGHT,
                          }
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 text-left text-sm transition-colors cursor-pointer",
                        virtualize ? "h-full" : "py-2",
                        isSelected
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-foreground/5 hover:text-accent-foreground",
                      )}
                    >
                      {option.iconUrl ? (
                        <img
                          src={option.iconUrl}
                          alt=""
                          className="size-7 shrink-0 rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <CheckIcon className="size-4 shrink-0 text-primary" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
