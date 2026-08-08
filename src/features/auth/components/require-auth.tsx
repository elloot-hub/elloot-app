"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context";
import { routes } from "@/lib/routes";

type Props = {
  children: React.ReactNode;
};

/**
 * Exige sessão. Redireciona para login com `?next=` para voltar depois.
 */
export function RequireAuth({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname && pathname !== routes.login
        ? `?next=${encodeURIComponent(pathname)}`
        : "";
      router.replace(`${routes.login}${next}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Redirecionando para o login…</p>
      </div>
    );
  }

  return children;
}
