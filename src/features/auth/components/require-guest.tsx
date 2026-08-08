"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { routes } from "@/lib/routes";

type Props = {
  children: React.ReactNode;
  /** Destino quando já autenticado. */
  redirectTo?: string;
};

/**
 * Bloqueia páginas de convidado (login/register) se o usuário já estiver logado.
 */
export function RequireGuest({
  children,
  redirectTo = routes.market,
}: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Redirecionando…</p>
      </div>
    );
  }

  return children;
}
