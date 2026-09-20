import { LockIcon, PackageIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/features/catalog/components/category-grid";
import {
  fetchBrowseCategories,
  fetchCatalogListings,
} from "@/features/catalog/api";
import {
  HOME_GRID_DESKTOP_LIMIT,
  pickHomeGridCategories,
} from "@/features/catalog/home-categories";
import { fetchHomeSections, HomeSections } from "@/features/home";
import { HomeHero } from "@/features/marketing/components/home-hero";
import { fetchPublicHomeLinks } from "@/features/site/api";
import { routes } from "@/lib/routes";

export default async function HomePage() {
  const [{ categories }, home, homeLinks] = await Promise.all([
    fetchBrowseCategories(),
    fetchHomeSections(),
    fetchPublicHomeLinks(),
  ]);

  const gridCategories = pickHomeGridCategories(
    categories,
    HOME_GRID_DESKTOP_LIMIT,
  );
  const carouselCategories =
    categories.filter((c) => c.showInMenu || c.isFeatured).length > 0
      ? categories.filter((c) => c.showInMenu || c.isFeatured)
      : categories.slice(0, 24);

  const fallbackListings =
    home.sections.length === 0
      ? (await fetchCatalogListings({ limit: 8 })).listings
      : [];

  return (
    <>
      <HomeHero categories={carouselCategories} />

      <section className="py-8 sm:py-10">
        <Container className="space-y-5">
          <div className="flex flex-col items-center justify-center gap-1">
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

      <Container>
        <HomeSections
          sections={home.sections}
          fallbackListings={fallbackListings}
        />
      </Container>

      <section className="bg-muted/20 py-14 sm:py-16">
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

          {homeLinks.length > 0 ? (
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-sm">
              {homeLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </Container>
      </section>
    </>
  );
}
