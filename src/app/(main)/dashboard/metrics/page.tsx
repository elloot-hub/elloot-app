import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MetricsClient } from "@/features/dashboard/components/metrics-client";
import { MetricsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Métricas",
};

const VALID_TABS = new Set(["overview", "listings", "costs", "service"]);

type PageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function DashboardMetricsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  if (!raw || !VALID_TABS.has(raw)) {
    redirect(routes.dashboardMetricsTab("overview"));
  }

  return (
    <RequireAuth>
      <DashboardShell
        title="Métricas de Vendas"
        description="Receita, volume e desempenho dos seus anúncios."
      >
        <Suspense fallback={<MetricsSkeleton />}>
          <MetricsClient />
        </Suspense>
      </DashboardShell>
    </RequireAuth>
  );
}
