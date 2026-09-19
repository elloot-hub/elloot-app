import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ListingCard } from "@/features/catalog/components/listing-card";
import { HomeSectionBlock } from "@/features/home/components/home-section-block";
import type { HomeSectionPayload } from "@/features/home/api";
import type { ListingSummary } from "@/types/api";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  sections: HomeSectionPayload[];
  fallbackListings?: ListingSummary[];
};

export function HomeSections({ sections, fallbackListings = [] }: Props) {
  if (sections.length > 0) {
    return (
      <div className="space-y-2">
        {sections.map((section) => (
          <HomeSectionBlock key={section.id} section={section} />
        ))}
      </div>
    );
  }

  return (
    <section className="py-5 sm:py-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Badge>
              <p className="animate-rise font-heading tracking-wide">
                Anúncios recentes
              </p>
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Anúncios recentes no Mercado
            </h2>
          </div>
          <Link
            href={routes.market}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "rounded-full",
            )}
          >
            Abrir mercado
          </Link>
        </div>

        {fallbackListings.length === 0 ? (
          <div className="surface-panel px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não há anúncios ativos. Seja o primeiro a vender.
            </p>
            <Link
              href={routes.sell}
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-4 rounded-full",
              )}
            >
              Anunciar agora
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {fallbackListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
