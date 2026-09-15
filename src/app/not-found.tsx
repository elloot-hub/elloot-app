import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col pt-[var(--site-header-height)]">
        <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
          <p className="font-heading text-sm font-medium tracking-wide text-muted-foreground">
            404
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Página não encontrada
          </h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground text-pretty">
            O link pode estar quebrado ou a página foi removida. Volte ao
            mercado ou à página inicial.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={routes.home} className={cn(buttonVariants(), "h-11 px-6")}>
              Início
            </Link>
            <Link
              href={routes.market}
              className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6")}
            >
              Mercado
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
