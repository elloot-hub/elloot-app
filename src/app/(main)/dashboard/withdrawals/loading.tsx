import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default function WithdrawalsLoading() {
  return (
    <DashboardShell
      title="Saques"
      description="Retire o saldo liberado para sua chave PIX."
      breadcrumb={["Conta", "Financeiro", "Saques"]}
    >
      <WalletSkeleton />
    </DashboardShell>
  );
}
