import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardOverviewClient } from "@/features/dashboard/components/dashboard-overview-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Resumo"
        description="Carteira, pendências e o que importa hoje — como comprador e vendedor."
      >
        <DashboardOverviewClient />
      </DashboardShell>
    </RequireAuth>
  );
}
