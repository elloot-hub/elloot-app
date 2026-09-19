"use client";

import { useEffect, useRef } from "react";
import { fetchSession } from "@/features/auth/api";
import { useAuth } from "@/features/auth/context";
import {
  hardRedirect,
  readNextFromLocation,
  safeNextPath,
} from "@/features/auth/safe-next";
import { writeSessionSnapshot } from "@/features/auth/session-snapshot";
import { routes } from "@/lib/routes";

type Props = {
  children: React.ReactNode;
  /** Destino quando já autenticado e sem `?next=`. */
  redirectTo?: string;
};

/**
 * Bloqueia páginas de convidado (login/register) se o usuário já estiver logado.
 * Valida a sessão na API antes de redirecionar (evita loop em "Redirecionando…").
 */
export function RequireGuest({
  children,
  redirectTo = routes.home,
}: Props) {
  const { user, loading, logout } = useAuth();
  const startedRef = useRef(false);

  useEffect(() => {
    if (loading || !user) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const next = safeNextPath(readNextFromLocation(), redirectTo);

    void (async () => {
      try {
        writeSessionSnapshot(user);
        await fetchSession();
        hardRedirect(next);
      } catch {
        startedRef.current = false;
        logout();
      }
    })();
  }, [loading, user, redirectTo, logout]);

  if (loading || user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">
          {user ? "Redirecionando…" : "Carregando…"}
        </p>
      </div>
    );
  }

  return children;
}
