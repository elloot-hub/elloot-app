"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";
import { formatBRLFromCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ListingOffer } from "@/types/api";

type Props = {
  offers: ListingOffer[];
  value: string | null;
  onChange: (offerId: string) => void;
};

export function OfferSelectMenu({ offers, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected =
    offers.find((o) => o.id === value) ?? offers[0] ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return offers;
    return offers.filter((o) => o.title.toLowerCase().includes(q));
  }, [offers, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!selected) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center justify-between cursor-pointer gap-3 rounded-md border border-border/70 bg-background px-3 text-left text-sm transition-colors",
          "hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-none outline-none",
          open && "border-primary/40 ring-none ring-ring/40",
        )}
      >
        <span className="min-w-0 truncate font-medium">{selected.title}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 overflow-hidden rounded-md border border-border/70 bg-popover text-popover-foreground shadow-lg">
          <div className="border-b border-border/60 p-2">
            <label className="flex h-9 items-center gap-2 rounded-md border border-border/60 bg-background px-2.5">
              <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar por item..."
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>

          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhuma oferta encontrada.
              </li>
            ) : (
              filtered.map((offer) => {
                const soldOut = offer.stockQuantity < 1;
                const isSelected = offer.id === selected.id;
                const offerAuto = offer.deliveryMode === "AUTO";
                return (
                  <li key={offer.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(offer.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between cursor-pointer gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-muted/40",
                        soldOut && "opacity-70",
                      )}
                    >
                      <span className="min-w-0 space-y-1">
                        <span className="block truncate text-sm font-semibold">
                          {offer.title}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                          {offerAuto ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500">
                              <FaTruckFast className="size-3" />
                              Entrega automática
                            </span>
                          ) : (
                            <span>Entrega manual</span>
                          )}
                          <span>
                            {soldOut
                              ? "0 em estoque"
                              : `${offer.stockQuantity} em estoque`}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-primary tabular-nums">
                        {formatBRLFromCents(offer.priceCents)}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
