import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MetricsClient } from "@/features/dashboard/components/metrics-client";

export const metadata: Metadata = {
  title: "Métricas",
};

export default function DashboardMetricsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Métricas"
        description="Desempenho das suas vendas e anúncios."
        breadcrumb={["Conta", "Vendas", "Métricas"]}
      >
        <MetricsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
