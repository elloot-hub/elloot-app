import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { WalletClient } from "@/features/wallet/components/wallet-client";

export const metadata: Metadata = {
  title: "Carteira",
};

export default function DashboardWalletPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Extrato / saldo"
        description="Saldo liberado do escrow e movimentações recentes."
        breadcrumb={["Conta", "Financeiro", "Extrato"]}
      >
        <WalletClient />
      </DashboardShell>
    </RequireAuth>
  );
}
