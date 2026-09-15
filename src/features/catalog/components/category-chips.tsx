import Link from "next/link";
import { marketCategoryHref } from "@/features/catalog/market-path";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  activeSlug?: string;
  activeSlugPath?: string;
  className?: string;
};

/** Horizontal filter chips for market browse (legacy / compact). */
export function CategoryChips({
  categories,
  activeSlug,
  activeSlugPath,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      <Chip href={routes.market} active={!activeSlug && !activeSlugPath}>
        Todos
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.id}
          href={marketCategoryHref(category)}
          active={
            activeSlugPath
              ? category.slugPath === activeSlugPath
              : activeSlug === category.slug
          }
        >
          {category.name}
        </Chip>
      ))}
    </div>
  );
}

function Chip({
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
        "inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary/50 bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_hsl(217_91%_50%/0.9)]"
          : "border-border/70 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
