"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <p className="font-heading text-sm font-medium tracking-wide text-muted-foreground">
        Erro
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Algo deu errado
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground text-pretty">
        Tente novamente. Se o problema continuar, volte ao início e recarregue
        a página.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" className="h-11 px-6" onClick={reset}>
          Tentar de novo
        </Button>
        <Link
          href={routes.home}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6")}
        >
          Início
        </Link>
      </div>
    </Container>
  );
}
