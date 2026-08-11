import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ReviewsDashboardClient } from "@/features/dashboard/components/reviews-dashboard-client";

export const metadata: Metadata = {
  title: "Avaliações recebidas",
};

export default function DashboardReviewsReceivedPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Avaliações recebidas"
        description="Notas e comentários dos compradores nas suas vendas."
        breadcrumb={["Conta", "Vendas", "Avaliações"]}
      >
        <ReviewsDashboardClient mode="received" />
      </DashboardShell>
    </RequireAuth>
  );
}
