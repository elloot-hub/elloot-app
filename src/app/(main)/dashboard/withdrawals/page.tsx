import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { WithdrawalsClient } from "@/features/dashboard/components/withdrawals-client";

export const metadata: Metadata = {
  title: "Minhas retiradas",
};

export default function DashboardWithdrawalsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Minhas retiradas"
        description="Solicite a transferência do seu saldo disponível via PIX."
      >
        <WithdrawalsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
