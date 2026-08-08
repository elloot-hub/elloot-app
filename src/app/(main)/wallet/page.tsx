import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carteira",
};

export default function WalletPage() {
  return (
    <RequireAuth>
      <Container className="space-y-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Carteira</h1>
        <p className="max-w-lg text-muted-foreground">
          Saldo e extrato chegam na próxima etapa.
        </p>
        <Link
          href={routes.account}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Voltar à conta
        </Link>
      </Container>
    </RequireAuth>
  );
}
