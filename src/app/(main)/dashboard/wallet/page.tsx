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
        description="Saldo liberado, valores em escrow e histórico de movimentações."
      >
        <WalletClient />
      </DashboardShell>
    </RequireAuth>
  );
}
