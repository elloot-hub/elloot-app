"use client";

import { useMemo, useState } from "react";
import { CoinsIcon, GridIcon, LayersIcon, PackageIcon, SearchIcon, SparklesIcon, StoreIcon, SwordsIcon, WrenchIcon, } from "lucide-react";
import { ListingCard } from "@/features/catalog/components/listing-card";
import type { ListingProductType, ListingSummary } from "@/types/api";
import type { SellerClassFilter } from "../types";
import { cn } from "@/lib/utils";

type Props = {
  listings: ListingSummary[];
  sellerName: string;
};

const CLASS_CONFIG: Record<ListingProductType, { label: string; icon: React.ReactNode; color: string; badgeBg: string }> = {
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

  const activeClasses = useMemo(() => {
    return (Object.keys(classCounts) as ListingProductType[]).filter(
      (cls) => classCounts[cls] > 0,
    );
  }, [classCounts]);

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
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
            Anúncios à venda
          </h2>
          <p className="text-xs text-muted-foreground">
            {listings.length === 0
              ? `${sellerName} ainda não tem anúncios ativos.`
              : `${filteredListings.length} de ${listings.length} anúncio${listings.length === 1 ? "" : "s"}`}
          </p>
        </div>

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
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-14 text-center">
          <PackageIcon className="mb-3 size-10 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">
            Nenhum anúncio ativo
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Quando {sellerName} publicar itens, eles aparecem aqui.
          </p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center">
          <SearchIcon className="mb-2 size-8 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">
            Nenhum resultado
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tente outro termo ou classe.
          </p>
        </div>
      ) : viewMode === "SECTIONS" && selectedClass === "ALL" ? (
        <div className="space-y-8">
          {activeClasses.map((cls) => {
            const items = listingsByClass[cls];
            if (!items || items.length === 0) return null;
            const cfg = CLASS_CONFIG[cls];

            return (
              <div key={cls} className="space-y-3">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
};