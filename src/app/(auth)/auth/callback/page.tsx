"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");

    if (!accessToken) {
      if (loading) return;
      if (user) {
        router.replace(routes.market);
        return;
      }
      setError("Token ausente no retorno do login social.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await setSession(accessToken);
        if (!cancelled) router.replace(routes.market);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Falha ao concluir login social.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setSession, user, loading]);

  if (error) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Erro no login</h1>
        <p className="text-sm text-destructive">{error}</p>
        <Link
          href={routes.login}
          className="text-sm underline-offset-4 hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2 text-center py-46">
      <h1 className="text-xl font-semibold tracking-tight">Conectando…</h1>
      <p className="text-sm text-muted-foreground">
        Finalizando autenticação social.
      </p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-muted-foreground">Carregando…</p>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
