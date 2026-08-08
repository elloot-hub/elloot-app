import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import type { SitePageContent } from "@/features/site/content/pages";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Props = {
  content: SitePageContent;
};

export function ContentPage({ content }: Props) {
  return (
    <Container className="max-w-3xl space-y-8 py-12 sm:py-16">
      <div className="space-y-3">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          Elloot
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {content.title}
        </h1>
        <p className="text-muted-foreground text-pretty">{content.description}</p>
      </div>

      <div className="space-y-8">
        {content.sections.map((section) => (
          <section key={section.heading ?? section.body[0]} className="space-y-3">
            {section.heading ? (
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                {section.heading}
              </h2>
            ) : null}
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm leading-relaxed text-muted-foreground text-pretty sm:text-[0.95rem]"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border/50 pt-8">
        <Link href={routes.help} className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
          Central de ajuda
        </Link>
        <Link
          href={routes.contact}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Contato
        </Link>
      </div>
    </Container>
  );
}
