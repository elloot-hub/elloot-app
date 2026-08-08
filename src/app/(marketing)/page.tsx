import Link from "next/link";
import { ArrowRightIcon, LockIcon, PackageIcon, ShieldCheckIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/features/catalog/components/category-grid";
import { ListingCard } from "@/features/catalog/components/listing-card";
import {
  fetchBrowseCategories,
  fetchCatalogListings,
} from "@/features/catalog/api";
import {
  HOME_GRID_DESKTOP_LIMIT,
  pickHomeGridCategories,
} from "@/features/catalog/home-categories";
import { HomeHero } from "@/features/marketing/components/home-hero";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const [{ categories }, catalog] = await Promise.all([
    fetchBrowseCategories(),
    fetchCatalogListings({ limit: 8 }),
  ]);

  const gridCategories = pickHomeGridCategories(
    categories,
    HOME_GRID_DESKTOP_LIMIT,
  );
  const carouselCategories =
    categories.filter((c) => c.showInMenu || c.isFeatured).length > 0
      ? categories.filter((c) => c.showInMenu || c.isFeatured)
      : categories.slice(0, 24);

  return (
    <>
      <HomeHero categories={carouselCategories} />

      <section className="py-12 sm:py-16">
        <Container className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <Badge>
              <p className="animate-rise font-heading tracking-wide">
                Escolha uma categoria
              </p>
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Categorias populares
            </h2>
          </div>
          <CategoryGrid
            categories={gridCategories}
            fadeBottom
            viewAllHref={routes.market}
            viewAllLabel="Ver todas categorias"
          />
        </Container>
      </section>

      <section className="border-t border-border/50 py-12 sm:py-16">
        <Container className="space-y-8">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Anúncios recentes
              </h2>
              <p className="text-sm text-muted-foreground">
                Ofertas ativas protegidas por escrow.
              </p>
            </div>
            <Link
              href={routes.market}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full",
              )}
            >
              Abrir mercado
            </Link>
          </div>
          {catalog.listings.length === 0 ? (
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
              {catalog.listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-border/50 bg-muted/20 py-14 sm:py-16">
        <Container className="space-y-10">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Como funciona o escrow
            </h2>
            <p className="text-sm text-muted-foreground">
              Três passos simples — o mesmo fluxo dos marketplaces sérios.
            </p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              {
                icon: PackageIcon,
                title: "1. Pedido",
                body: "O comprador paga. O valor fica bloqueado e o anúncio é reservado.",
              },
              {
                icon: LockIcon,
                title: "2. Entrega",
                body: "O vendedor entrega no chat. Tudo permanece na plataforma.",
              },
              {
                icon: ShieldCheckIcon,
                title: "3. Liberação",
                body: "O comprador confirma (ou o prazo). A carteira do vendedor é creditada.",
              },
            ].map((step) => (
              <li
                key={step.title}
                className="surface-panel space-y-3 p-5 sm:p-6"
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <step.icon className="size-5" />
                </div>
                <h3 className="font-heading font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}
