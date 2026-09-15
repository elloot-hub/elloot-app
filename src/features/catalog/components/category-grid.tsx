import Link from "next/link";
import { getCategoryVisual } from "@/features/catalog/category-visuals";
import { getCategoryIcon } from "@/features/catalog/phosphor-icons";
import { HOME_GRID_MOBILE_LIMIT } from "@/features/catalog/home-categories";
import { marketCategoryHref } from "@/features/catalog/market-path";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/api";

type Props = {
  categories: Category[];
  className?: string;
  fadeBottom?: boolean;
  viewAllHref?: string;
  viewAllLabel?: string;
  mobileLimit?: number;
};

export function CategoryGrid({ categories, className, fadeBottom = false, viewAllHref = routes.market, viewAllLabel = "Ver todas categorias", mobileLimit = HOME_GRID_MOBILE_LIMIT, }: Props) {
  if (categories.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma categoria disponível ainda.
      </p>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      <div className={cn(fadeBottom && "relative")}>
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6",
            fadeBottom && "pb-2",
          )}
        >
          {categories.map((category, index) => {
            const visual = getCategoryVisual(category.slug);
            const Icon = getCategoryIcon(category.icon) ?? visual.Icon;
            const hideOnMobile = index >= mobileLimit;
            return (
              <Link
                key={category.id}
                href={marketCategoryHref(category)}
                className={cn(
                  "group relative aspect-[3/4] overflow-hidden rounded-md outline-none select-none",
                  "border border-primary/40 transition-[transform,box-shadow] duration-300",
                  "hover:-translate-y-1 hover:border-primary/50 transition-all duration-300",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  "animate-rise",
                  hideOnMobile && "hidden md:block",
                )}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt=""
                    className="absolute inset-0 size-full object-cover transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="absolute inset-0 transition-transform duration-500"
                    style={{ background: visual.gradient }}
                  />
                )}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white/18,transparent_45%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {!category.imageUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      className="size-12 text-white/90 drop-shadow-lg transition-transform duration-300 sm:size-14"
                      style={{ color: visual.accent }}
                    />
                  </div>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
                  <p className="font-heading text-sm font-semibold tracking-tight text-white drop-shadow">
                    {category.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {fadeBottom ? (
          <div aria-hidden className="pointer-events-none select-none absolute inset-x-0 bottom-0 w-full h-[32%] md:h-[40%]">
            <div
              className="absolute inset-0 backdrop-blur-sm sm:backdrop-blur-sm"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 28%, black 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, black 28%, black 100%)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-10% via-background/90 via-[80%] to-background to-[100%]" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
