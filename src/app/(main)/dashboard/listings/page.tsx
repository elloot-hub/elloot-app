import type { Metadata } from "next";
import Link from "next/link";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { MyListingsClient } from "@/features/dashboard/components/my-listings-client";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Meus anúncios",
};

export default function DashboardListingsPage() {
  return (
    <RequireAuth>
      <DashboardShell
        title="Meus anúncios"
        description="Gerencie o que você publicou no marketplace."
        actions={
          <Link
            href={routes.sell}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Novo anúncio
          </Link>
        }
      >
        <MyListingsClient />
      </DashboardShell>
    </RequireAuth>
  );
}
