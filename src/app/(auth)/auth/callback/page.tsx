"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { exchangeOAuthCode } from "@/features/auth/api";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";
import { routes } from "@/lib/routes";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const code = searchParams.get("code");
  const legacyToken = searchParams.get("accessToken");

  // Exchange OAuth code once — do not depend on `user` (setSession would re-trigger).
  useEffect(() => {
    if (!code && !legacyToken) return;

    const lockKey = code
      ? `elloot.oauth.exchange:${code}`
      : `elloot.oauth.legacy:${legacyToken}`;
    try {
      if (sessionStorage.getItem(lockKey) === "done") {
        router.replace(routes.market);
        return;
      }
      if (sessionStorage.getItem(lockKey) === "pending" && startedRef.current) {
        return;
      }
      sessionStorage.setItem(lockKey, "pending");
    } catch {
      // private mode — fall through with ref only
    }

    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        if (code) {
          const result = await exchangeOAuthCode(code);
          await setSession(null, result.user);
        } else if (legacyToken) {
          // Legacy URL token: cookie not set — reject and ask to re-login.
          throw new ApiError(
            400,
            "OAUTH_LEGACY",
            "Faça login social novamente.",
          );
        }
        try {
          sessionStorage.setItem(lockKey, "done");
        } catch {
          /* ignore */
        }
        router.replace(routes.market);
      } catch (err) {
        startedRef.current = false;
        try {
          sessionStorage.removeItem(lockKey);
        } catch {
          /* ignore */
        }
        setError(
          err instanceof ApiError
            ? err.message
            : "Falha ao concluir login social.",
        );
      }
    })();
  }, [code, legacyToken, router, setSession]);

  // No code in URL: redirect if already logged in, else show error when ready.
  useEffect(() => {
    if (code || legacyToken) return;
    if (loading) return;
    if (user) {
      router.replace(routes.market);
      return;
    }
    setError("Código de autenticação ausente no retorno do login social.");
  }, [code, legacyToken, loading, user, router]);

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
