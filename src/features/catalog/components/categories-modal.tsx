"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchIcon, XIcon } from "lucide-react";
import { fetchBrowseCategories } from "@/features/catalog/api";
import { marketCategoryHref } from "@/features/catalog/market-path";
import type { Category } from "@/types/api";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function CategoriesModal({ open, onClose }: Props) {
  const titleId = useId();
  const filterRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [entered, setEntered] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setShow(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(raf);
    }

    setEntered(false);
    const t = window.setTimeout(() => setShow(false), 280);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => filterRef.current?.focus(), 120);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open || loaded.current) return;
    let cancelled = false;
    setLoading(true);
    void fetchBrowseCategories()
      .then((res) => {
        if (cancelled) return;
        const sorted = [...res.categories].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        );
        setCategories(sorted);
        loaded.current = true;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = normalize(filter);
    if (!q) return categories;
    return categories.filter(
      (c) =>
        normalize(c.name).includes(q) || normalize(c.slug).includes(q),
    );
  }, [categories, filter]);

  if (!mounted || !show) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 transition-opacity duration-200 ease-out ${entered ? "opacity-100" : "opacity-0"
        }`}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-10 flex h-[min(88vh,860px)] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-border/50 bg-background shadow-[0_24px_80px_-20px_rgba(0,0,0,0.45)] transition-all duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] ${entered
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-[18px] scale-[0.97]"
          }`}
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border/50 px-5 py-4 sm:px-6">
          <h2
            id={titleId}
            className="font-heading text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Categorias
          </h2>

          <div className="ml-auto flex min-w-0 w-full items-center justify-end gap-2 sm:w-auto sm:max-w-sm sm:flex-1">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Filtrar categorias</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={filterRef}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar categorias"
                className="h-10 w-full rounded-full border border-border/70 bg-muted/40 pr-3 pl-10 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/45 focus:ring-3 focus:ring-primary/12"
              />
            </label>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="icon-lg"
              aria-label="Fechar categorias"
            >
              <XIcon />
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div className="h-full overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
            {loading ? (
              <p className="px-2 py-16 text-center text-sm text-muted-foreground">
                Carregando categorias…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-16 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-1 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={marketCategoryHref(category)}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    >
                      <CategoryAvatar category={category} />
                      <span className="min-w-0 truncate font-medium">
                        {category.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CategoryAvatar({ category }: { category: Category }) {
  const [broken, setBroken] = useState(false);
  const src = category.imageUrl || category.iconUrl;

  if (!src || broken) {
    return (
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
        {category.name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/50">
      <img
        src={src}
        alt=""
        className="size-full object-cover"
        onError={() => setBroken(true)}
      />
    </span>
  );
};