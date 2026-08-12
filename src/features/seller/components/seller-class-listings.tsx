"use client";

import { useMemo, useState } from "react";
import {
  CoinsIcon,
  CrownIcon,
  GridIcon,
  LayersIcon,
  PackageIcon,
  SearchIcon,
  ShieldAlertIcon,
  SparklesIcon,
  SwordsIcon,
  WrenchIcon,
} from "lucide-react";
import { ListingCard } from "@/features/catalog/components/listing-card";
import type { ListingProductType, ListingSummary } from "@/types/api";
import type { SellerClassFilter } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  listings: ListingSummary[];
  sellerName: string;
};

const CLASS_CONFIG: Record<
  ListingProductType,
  { label: string; icon: React.ReactNode; color: string; badgeBg: string }
> = {
  CONTA: {
    label: "Contas & Personagens",
    icon: <SwordsIcon className="size-4 text-violet-400" />,
    color: "text-violet-400",
    badgeBg: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  },
  ITEM: {
    label: "Itens & Skins",
    icon: <PackageIcon className="size-4 text-amber-400" />,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  SERVICO: {
    label: "Serviços & Boosting",
    icon: <WrenchIcon className="size-4 text-sky-400" />,
    color: "text-sky-400",
    badgeBg: "bg-sky-500/10 border-sky-500/20 text-sky-400",
  },
  GOLD: {
    label: "Moedas & Gold",
    icon: <CoinsIcon className="size-4 text-emerald-400" />,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  OUTROS: {
    label: "Geral / Outros",
    icon: <SparklesIcon className="size-4 text-rose-400" />,
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
};

export function SellerClassListings({ listings, sellerName }: Props) {
  const [selectedClass, setSelectedClass] = useState<SellerClassFilter>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"SECTIONS" | "GRID">("SECTIONS");

  // Calculate counts per class
  const classCounts = useMemo(() => {
    const counts: Record<ListingProductType, number> = {
      CONTA: 0,
      ITEM: 0,
      SERVICO: 0,
      GOLD: 0,
      OUTROS: 0,
    };

    for (const item of listings) {
      const type = (item.productType || "OUTROS") as ListingProductType;
      if (counts[type] !== undefined) {
        counts[type] += 1;
      } else {
        counts["OUTROS"] += 1;
      }
    }
    return counts;
  }, [listings]);

  // Active classes seller actually sells
  const activeClasses = useMemo(() => {
    return (Object.keys(classCounts) as ListingProductType[]).filter(
      (cls) => classCounts[cls] > 0,
    );
  }, [classCounts]);

  // Filtered listings based on search & class tab
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.name.toLowerCase().includes(searchTerm.toLowerCase());

      const itemType = (item.productType || "OUTROS") as ListingProductType;
      const matchesClass =
        selectedClass === "ALL" || itemType === selectedClass;

      return matchesSearch && matchesClass;
    });
  }, [listings, searchTerm, selectedClass]);

  // Group listings by class for SECTIONS view mode
  const listingsByClass = useMemo(() => {
    const grouped: Record<ListingProductType, ListingSummary[]> = {
      CONTA: [],
      ITEM: [],
      SERVICO: [],
      GOLD: [],
      OUTROS: [],
    };

    for (const item of filteredListings) {
      const type = (item.productType || "OUTROS") as ListingProductType;
      if (grouped[type]) {
        grouped[type].push(item);
      } else {
        grouped["OUTROS"].push(item);
      }
    }

    return grouped;
  }, [filteredListings]);

  return (
    <section className="space-y-5">
      {/* Header & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CrownIcon className="size-5 text-amber-400" />
            Catálogo de Anúncios à Venda
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredListings.length} produtos disponíveis fornecidos por {sellerName}.
          </p>
        </div>

        {/* Controls: Search + View Mode */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar itens do vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-border/60 bg-card/40 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center rounded-md border border-border/60 bg-card/40 p-0.5">
            <button
              onClick={() => setViewMode("SECTIONS")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                viewMode === "SECTIONS"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Visualizar separado por Classe/Seção"
            >
              <LayersIcon className="size-3.5" />
              <span className="hidden sm:inline">Classes</span>
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                viewMode === "GRID"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Visualizar em Grade Total"
            >
              <GridIcon className="size-3.5" />
              <span className="hidden sm:inline">Grade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Class */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedClass("ALL")}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
            selectedClass === "ALL"
              ? "border-primary bg-primary/15 text-primary shadow-sm"
              : "border-border/60 bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground",
          )}
        >
          <span>Todas as Classes</span>
          <span className="rounded-full bg-background/80 px-1.5 py-0.2 text-[10px] tabular-nums font-bold">
            {listings.length}
          </span>
        </button>

        {activeClasses.map((cls) => {
          const cfg = CLASS_CONFIG[cls];
          const count = classCounts[cls];
          return (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
                selectedClass === cls
                  ? "border-primary bg-primary/15 text-primary shadow-sm"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground",
              )}
            >
              {cfg.icon}
              <span>{cfg.label}</span>
              <span className="rounded-full bg-background/80 px-1.5 py-0.2 text-[10px] tabular-nums font-bold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Listings View */}
      {filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <ShieldAlertIcon className="size-10 text-muted-foreground/60 mb-2" />
          <h3 className="text-base font-semibold text-foreground">
            Nenhum produto encontrado
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            Não foram encontrados produtos nesta classe ou com os termos pesquisados.
          </p>
        </div>
      ) : viewMode === "SECTIONS" && selectedClass === "ALL" ? (
        /* SECTIONS VIEW MODE (Separado por Classe) */
        <div className="space-y-8">
          {activeClasses.map((cls) => {
            const items = listingsByClass[cls];
            if (!items || items.length === 0) return null;
            const cfg = CLASS_CONFIG[cls];

            return (
              <div key={cls} className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-background p-1.5 border border-border/50">
                      {cfg.icon}
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {cfg.label}
                    </h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold border", cfg.badgeBg)}>
                      {items.length} {items.length === 1 ? "anúncio" : "anúncios"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Ver somente esta classe →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID VIEW MODE */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}
