"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { centsToQueryDecimal, formatPriceMask, formatPriceMaskFromCents, parseBrlToCents, } from "@/lib/format";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import type { CatalogListingsSort } from "@/features/catalog/api";

const SORT_OPTIONS: { value: CatalogListingsSort; label: string }[] = [
  { value: "best_sellers", label: "Mais vendidos" },
  { value: "recent", label: "Mais recentes" },
  { value: "price_asc", label: "Menor valor" },
  { value: "price_desc", label: "Maior valor" },
  { value: "reputation", label: "Reputação" },
];

const SORT_ITEMS = SORT_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export type SubcategoryNavItem = {
  id: string;
  name: string;
  href: string;
  count?: number;
};

function usePriceFilterNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function applyPriceValues(minMasked: string, maxMasked: string) {
    const params = new URLSearchParams(searchParams.toString());
    const minCents = parseBrlToCents(minMasked);
    const maxCents = parseBrlToCents(maxMasked);

    if (minCents != null) params.set("min", centsToQueryDecimal(minCents));
    else params.delete("min");
    if (maxCents != null) params.set("max", centsToQueryDecimal(maxCents));
    else params.delete("max");

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function clearPrice() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("min");
    params.delete("max");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return { pending, applyPriceValues, clearPrice };
}

function PriceFilterInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "opacity-50",
        className,
      )}
    >
      <span className="shrink-0 pl-2.5 text-xs text-muted-foreground select-none">
        R$
      </span>
      <input
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(formatPriceMask(e.target.value))}
        placeholder={placeholder ?? "0,00"}
        inputMode="numeric"
        disabled={disabled}
        aria-label={ariaLabel}
        className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground tabular-nums"
      />
    </div>
  );
}

type SidebarProps = {
  allCategoriesHref?: string;
  parentHref?: string | null;
  parentLabel?: string | null;
  items: SubcategoryNavItem[];
  activeId: string;
  allHref: string;
  allCount?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
};

export function MarketCategorySidebar({
  allCategoriesHref = routes.market,
  items,
  activeId,
  allHref,
  allCount,
  minPriceCents,
  maxPriceCents,
}: SidebarProps) {
  const { pending, applyPriceValues, clearPrice } = usePriceFilterNavigate();
  const [minValue, setMinValue] = useState(() =>
    minPriceCents != null ? formatPriceMaskFromCents(minPriceCents) : "",
  );
  const [maxValue, setMaxValue] = useState(() =>
    maxPriceCents != null ? formatPriceMaskFromCents(maxPriceCents) : "",
  );

  useEffect(() => {
    setMinValue(
      minPriceCents != null ? formatPriceMaskFromCents(minPriceCents) : "",
    );
    setMaxValue(
      maxPriceCents != null ? formatPriceMaskFromCents(maxPriceCents) : "",
    );
  }, [minPriceCents, maxPriceCents]);

  const hasPrice = minPriceCents != null || maxPriceCents != null;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-3">
        <div className="space-y-1">
          <Link
            href={allCategoriesHref}
            className="block text-sm font-medium text-primary hover:underline"
          >
            Ver todas as categorias
          </Link>
        </div>

        {items.length > 0 ? (
          <nav className="space-y-0.5" aria-label="Subcategorias">
            <SidebarLink href={allHref} active={activeId === "__all__"}>
              <span>Todos</span>
              {typeof allCount === "number" ? (
                <span className="tabular-nums opacity-70">{allCount}</span>
              ) : null}
            </SidebarLink>
            {items.map((item) => (
              <SidebarLink
                key={item.id}
                href={item.href}
                active={item.id === activeId}
              >
                <span className="truncate">{item.name}</span>
                {typeof item.count === "number" ? (
                  <span className="shrink-0 tabular-nums opacity-70">
                    {item.count}
                  </span>
                ) : null}
              </SidebarLink>
            ))}
          </nav>
        ) : null}

        <div className="space-y-2 border-t border-border/50 pt-5">
          <p className="px-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Preço
          </p>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              applyPriceValues(minValue, maxValue);
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <PriceFilterInput
                name="min"
                value={minValue}
                onChange={setMinValue}
                placeholder="Mín."
                aria-label="Preço mínimo"
                disabled={pending}
              />
              <PriceFilterInput
                name="max"
                value={maxValue}
                onChange={setMaxValue}
                placeholder="Máx."
                aria-label="Preço máximo"
                disabled={pending}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" disabled={pending}>
                Aplicar
              </Button>
              {hasPrice ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={clearPrice}
                >
                  Limpar
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-primary/15 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

type ToolbarProps = {
  defaultQ?: string;
  sort?: CatalogListingsSort;
  activeFilters?: { label: string; clearHref: string }[];
};

export function MarketBrowseToolbar({
  defaultQ = "",
  sort = "best_sellers",
  activeFilters = [],
}: ToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function push(next: { q?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const qValue = next.q !== undefined ? next.q : (searchParams.get("q") ?? "");
    const sortValue =
      next.sort !== undefined ? next.sort : (searchParams.get("sort") ?? sort);

    if (qValue.trim()) params.set("q", qValue.trim());
    else params.delete("q");

    if (sortValue && sortValue !== "best_sellers") params.set("sort", sortValue);
    else params.delete("sort");

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="relative min-w-0 flex-1 sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            push({ q: String(form.get("q") ?? "") });
          }}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={defaultQ}
            placeholder="Buscar nesta categoria…"
            disabled={pending}
            className="h-10 rounded-md border-border/80 bg-background/80 pl-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-sm text-muted-foreground">
            Ordenar por
          </span>
          <Select
            value={sort}
            items={SORT_ITEMS}
            disabled={pending}
            onValueChange={(value) => {
              const next = (value ?? "best_sellers") as CatalogListingsSort;
              push({ sort: next });
            }}
          >
            <SelectTrigger className="h-10 w-[11.5rem]" size="default">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Link
              key={filter.label}
              href={filter.clearHref}
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "h-7 gap-1 rounded-full px-2.5 text-xs",
              )}
            >
              {filter.label}
              <span aria-hidden>×</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Mobile price + sticky subcat chips */
export function MarketMobileFilters({
  items,
  activeId,
  allHref,
  allCount,
  minPriceCents,
  maxPriceCents,
  parentHref,
  parentLabel,
}: {
  items: SubcategoryNavItem[];
  activeId: string;
  allHref: string;
  allCount?: number;
  minPriceCents?: number;
  maxPriceCents?: number;
  parentHref?: string | null;
  parentLabel?: string | null;
}) {
  const { pending, applyPriceValues } = usePriceFilterNavigate();
  const [minValue, setMinValue] = useState(() =>
    minPriceCents != null ? formatPriceMaskFromCents(minPriceCents) : "",
  );
  const [maxValue, setMaxValue] = useState(() =>
    maxPriceCents != null ? formatPriceMaskFromCents(maxPriceCents) : "",
  );

  useEffect(() => {
    setMinValue(
      minPriceCents != null ? formatPriceMaskFromCents(minPriceCents) : "",
    );
    setMaxValue(
      maxPriceCents != null ? formatPriceMaskFromCents(maxPriceCents) : "",
    );
  }, [minPriceCents, maxPriceCents]);

  return (
    <div className="space-y-3 lg:hidden">
      {parentHref && parentLabel ? (
        <Link
          href={parentHref}
          className="inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          ← {parentLabel}
        </Link>
      ) : null}

      {items.length > 0 ? (
        <div className="sticky top-[calc(var(--site-header-height,3.5rem)+0.5rem)] z-10 -mx-1 bg-background/90 px-1 py-2 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <MobileSubchip href={allHref} active={activeId === "__all__"}>
              Todos
              {typeof allCount === "number" ? ` (${allCount})` : ""}
            </MobileSubchip>
            {items.map((item) => (
              <MobileSubchip
                key={item.id}
                href={item.href}
                active={item.id === activeId}
              >
                {item.name}
                {typeof item.count === "number" ? ` (${item.count})` : ""}
              </MobileSubchip>
            ))}
          </div>
        </div>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          applyPriceValues(minValue, maxValue);
        }}
      >
        <PriceFilterInput
          name="min"
          value={minValue}
          onChange={setMinValue}
          placeholder="Mín."
          aria-label="Preço mínimo"
          disabled={pending}
          className="min-w-0 flex-1"
        />
        <PriceFilterInput
          name="max"
          value={maxValue}
          onChange={setMaxValue}
          placeholder="Máx."
          aria-label="Preço máximo"
          disabled={pending}
          className="min-w-0 flex-1"
        />
        <Button type="submit" size="sm" className="shrink-0" disabled={pending}>
          Filtrar
        </Button>
      </form>
    </div>
  );
}

function MobileSubchip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary text-primary-foreground"
          : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
