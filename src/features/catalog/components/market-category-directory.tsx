"use client";

import { useMemo, useState } from "react";
import { LayoutGridIcon, SearchIcon } from "lucide-react";
import { CategoryGrid } from "@/features/catalog/components/category-grid";
import { groupCategoriesByParent } from "@/features/catalog/market-path";
import type { Category } from "@/types/api";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

type Props = {
  categories: Category[];
};

export function MarketCategoryDirectory({ categories }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(filter);
    if (!q) return categories;
    return categories.filter(
      (c) =>
        normalize(c.name).includes(q) ||
        normalize(c.slug).includes(q) ||
        normalize(c.parent?.name ?? "").includes(q),
    );
  }, [categories, filter]);

  const sections = useMemo(
    () => groupCategoriesByParent(filtered),
    [filtered],
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Categorias
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Escolha um jogo ou vertical para ver subcategorias e anúncios com
            pagamento protegido.
          </p>
        </div>
        <label className="relative mx-auto block max-w-md text-left">
          <span className="sr-only">Filtrar categorias</span>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Digite aqui para filtrar"
            className="h-11 w-full rounded-md border border-border/70 bg-card/40 pr-3 pl-10 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/45 focus:ring-3 focus:ring-primary/12"
          />
        </label>
      </div>

      {sections.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Nenhuma categoria encontrada.
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              {section.title}
            </h2>
            <CategoryGrid
              categories={section.items}
              mobileLimit={section.items.length}
            />
          </section>
        ))
      )}
    </div>
  );
}
