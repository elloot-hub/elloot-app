"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { CategoriesModal } from "@/features/catalog/components/categories-modal";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

type Props = {
  className?: string;
};

export function HeaderSearch({ className }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const blurSearch = useCallback(() => {
    inputRef.current?.blur();
    setSearchFocused(false);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (categoriesOpen) {
          e.preventDefault();
          setCategoriesOpen(false);
          return;
        }
        if (document.activeElement === inputRef.current) {
          e.preventDefault();
          blurSearch();
        }
        return;
      }

      if (e.key !== "p" && e.key !== "P") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (categoriesOpen) return;
      if (isEditableTarget(e.target)) return;
      if (
        typeof window !== "undefined" &&
        !window.matchMedia("(min-width: 768px)").matches
      ) {
        return;
      }

      e.preventDefault();
      focusSearch();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [blurSearch, categoriesOpen, focusSearch]);

  return (
    <>
      <form
        className={cn("min-w-0 flex-1", className)}
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(
            new FormData(e.currentTarget).get("q") ?? "",
          ).trim();
          router.push(
            q ? `${routes.market}?q=${encodeURIComponent(q)}` : routes.market,
          );
          blurSearch();
        }}
      >
        <div
          className={cn(
            "mx-auto flex h-11 w-full max-w-2xl items-center rounded-full border bg-muted/50 transition-[border-color,box-shadow,background]",
            searchFocused
              ? "border-primary/50 bg-background/80 ring-3 ring-primary/15"
              : "border-border/70",
          )}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              name="q"
              placeholder="Pesquisar categorias, produtos ou usuários…"
              className="h-11 w-full min-w-0 rounded-full bg-transparent pr-2 pl-11 text-sm outline-none placeholder:text-muted-foreground"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
          </div>

          <Button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            variant="outline"
            size="sm"
            className="mr-1 hidden shrink-0 items-center rounded-full px-3 py-1 text-foreground/90 transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          >
            Categorias
            <ChevronDownIcon className="size-3.5 opacity-70" />
          </Button>
        </div>
      </form>

      <CategoriesModal
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </>
  );
}
