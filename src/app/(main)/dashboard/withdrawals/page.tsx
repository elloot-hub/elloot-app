import type { Metadata } from "next";
import Link from "next/link";
import { BanknoteIcon } from "lucide-react";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Saques",
};

export default function DashboardWithdrawalsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Saques"
        description="Retire o saldo liberado para sua chave PIX."
        breadcrumb={["Conta", "Financeiro", "Saques"]}
      >
        <div className="rounded-md border border-border/60 bg-card/40 px-5 py-10 text-center space-y-4">
          <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
            <BanknoteIcon className="size-6" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Saques em breve</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              O fluxo de retirada com PIX e histórico de solicitações está no
              roadmap. Por enquanto você já acompanha o saldo na carteira.
            </p>
          </div>
          <Link
            href={routes.dashboardWallet}
            className={cn(buttonVariants({ size: "sm" }), "inline-flex")}
          >
            Ver carteira
          </Link>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
