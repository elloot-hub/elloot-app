import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { WithdrawalsClient } from "@/features/dashboard/components/withdrawals-client";

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
        <WithdrawalsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
