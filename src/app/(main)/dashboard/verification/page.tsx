import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { VerificationClient } from "@/features/dashboard/components/verification-client";

export const metadata: Metadata = {
  title: "Verificação",
};

export default function DashboardVerificationPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Verificação"
        description="Status de identidade e confiança da conta."
        breadcrumb={["Conta", "Verificação"]}
      >
        <VerificationClient />
      </DashboardShell>
    </RequireAuth>
  );
}
