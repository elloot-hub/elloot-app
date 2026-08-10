import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { FavoritesClient } from "@/features/dashboard/components/favorites-client";

export const metadata: Metadata = {
  title: "Favoritos",
};

export default function DashboardFavoritesPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Favoritos"
        description="Anúncios que você salvou para olhar depois."
        breadcrumb={["Conta", "Compras", "Favoritos"]}
      >
        <FavoritesClient />
      </DashboardShell>
    </RequireAuth>
  );
}
