import type { Metadata } from "next";
import Link from "next/link";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardOverviewClient } from "@/features/dashboard/components/dashboard-overview-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Painel",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Resumo"
        description="Saldo, pedidos e atalhos do comprador e do vendedor."
        breadcrumb={["Conta", "Visão geral", "Resumo"]}
        actions={
          <Link
            href={routes.sell}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Anunciar
          </Link>
        }
      >
        <DashboardOverviewClient />
      </DashboardShell>
    </RequireAuth>
  );
}
