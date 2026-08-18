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

function safeNext(value: string | null, fallback: string): string {
  if (!value) return fallback;
  if (/[\\]/.test(value) || /%5c/i.test(value)) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("://")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}

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
    if (loading || !user) return;
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(safeNext(next, redirectTo));
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
