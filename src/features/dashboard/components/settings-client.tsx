"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { buttonVariants } from "@/components/ui/button";
import { SettingsSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  if (loading || !user) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <dl className="grid gap-4 rounded-md border border-border/60 bg-card/40 p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Nome</dt>
            <dd className="mt-1 font-medium">{user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Função</dt>
            <dd className="mt-1 font-mono text-xs">{user.role}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Chave PIX</dt>
            <dd className="mt-1 font-mono text-xs">
              {user.pixKey ?? "não definida"}
            </dd>
          </div>
        </dl>

      <div className="flex flex-wrap gap-3">
        <Link
          href={routes.dashboardVerification}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Verificação
        </Link>
        <Link
          href={routes.dashboardWallet}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Carteira
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push(routes.home);
          }}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
