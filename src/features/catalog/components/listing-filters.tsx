"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
};

export function ListingFilters({ categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const category =
    searchParams.get("category") ?? searchParams.get("game") ?? "";
  const q = searchParams.get("q") ?? "";

  function push(next: { category?: string; q?: string }) {
    const params = new URLSearchParams();
    const categoryValue =
      next.category !== undefined ? next.category : category;
    const qValue = next.q !== undefined ? next.q : q;
    if (categoryValue) params.set("category", categoryValue);
    if (qValue) params.set("q", qValue);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${routes.market}?${qs}` : routes.market);
    });
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        push({
          category: String(form.get("category") ?? ""),
          q: String(form.get("q") ?? ""),
        });
      }}
    >
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar contas, ranks, skins, serviços…"
          disabled={pending}
          className="h-10 rounded-xl border-border/80 bg-background/80 pl-9"
        />
      </div>
      <select
        name="category"
        defaultValue={category}
        disabled={pending}
        onChange={(e) => push({ category: e.target.value })}
        className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-56 dark:bg-input/30"
      >
        <option value="">Todas as categorias</option>
        {categories.map((item) => (
          <option key={item.id} value={item.slug}>
            {item.parent?.name ? `${item.parent.name} · ${item.name}` : item.name}
          </option>
        ))}
      </select>
      <button type="submit" className="sr-only">
        Buscar
      </button>
    </form>
  );
}
