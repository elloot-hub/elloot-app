import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { MetricsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

export default function MetricsLoading() {
  return (
    <DashboardShell
      title="Métricas de Vendas"
      description="Receita, volume e desempenho dos seus anúncios."
      breadcrumb={["Conta", "Vendas", "Métricas"]}
    >
      <MetricsSkeleton />
    </DashboardShell>
  );
}
