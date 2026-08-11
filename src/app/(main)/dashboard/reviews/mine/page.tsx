import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ReviewsDashboardClient } from "@/features/dashboard/components/reviews-dashboard-client";

export const metadata: Metadata = {
  title: "Minhas avaliações",
};

export default function DashboardReviewsMinePage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Minhas avaliações"
        description="Avaliações que você deixou após concluir compras."
        breadcrumb={["Conta", "Compras", "Minhas avaliações"]}
      >
        <ReviewsDashboardClient mode="mine" />
      </DashboardShell>
    </RequireAuth>
  );
}
