import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { OverviewSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

export default function DashboardLoading() {
  return (
    <DashboardShell
      title="Resumo geral"
      description="Visão rápida da sua conta no Elloot."
      breadcrumb={["Conta", "Resumo"]}
    >
      <OverviewSkeleton />
    </DashboardShell>
  );
}
