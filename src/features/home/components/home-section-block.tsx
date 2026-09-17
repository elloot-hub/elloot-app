import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { ListingsCarousel } from "@/features/home/components/listings-carousel";
import type { HomeSectionPayload } from "@/features/home/api";
import { cn } from "@/lib/utils";

const LG_COLS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
};

type Props = {
  section: HomeSectionPayload;
};

export function HomeSectionBlock({ section }: Props) {
  const columns = Math.min(8, Math.max(2, section.columns || 5));
  const href = section.viewMoreHref || "/market";
  const label = section.viewMoreLabel || "Ver mais";
  const isCarousel = section.layout === "CAROUSEL";

  return (
    <section className="py-6 sm:py-8">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1">
            {section.subtitle?.trim() ? (
              <Badge>
                <p className="animate-rise font-heading tracking-wide">
                  {section.subtitle.trim()}
                </p>
              </Badge>
            ) : null}
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
              {section.title}
            </h2>
          </div>
          <Link
            href={href}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "w-full shrink-0 rounded-full sm:w-auto",
            )}
          >
            {label}
          </Link>
        </div>

        {isCarousel ? (
          <ListingsCarousel listings={section.listings} />
        ) : (
          <>
            {/* Mobile: horizontal snap; md+: configured grid */}
            <div className="md:hidden">
              <ListingsCarousel listings={section.listings} />
            </div>
            <div
              className={cn(
                "hidden gap-4 md:grid md:grid-cols-3",
                LG_COLS[columns] ?? "lg:grid-cols-5",
              )}
            >
              {section.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
