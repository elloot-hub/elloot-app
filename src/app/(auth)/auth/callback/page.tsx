"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { exchangeOAuthCode } from "@/features/auth/api";
import { useAuth } from "@/features/auth/context";
import {
  isLoginRequires2fa,
  verify2faLogin,
} from "@/features/auth/two-factor-api";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";

function OAuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pending2fa, setPending2fa] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
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
          if (isLoginRequires2fa(result)) {
            setChallengeToken(result.challengeToken);
            setEmailHint(result.emailHint ?? null);
            try {
              sessionStorage.setItem(lockKey, "done");
            } catch {
              /* ignore */
            }
            return;
          }
          await setSession(null, result.user!);
        } else if (legacyToken) {
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
    if (code || legacyToken || challengeToken) return;
    if (loading) return;
    if (user) {
      router.replace(routes.market);
      return;
    }
    setError("Código de autenticação ausente no retorno do login social.");
  }, [code, legacyToken, challengeToken, loading, user, router]);

  async function onVerify2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    const totp = otp.join("");
    if (totp.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError(null);
    setPending2fa(true);
    try {
      const result = await verify2faLogin({
        challengeToken,
        code: totp,
      });
      await setSession(null, result.user!);
      router.replace(routes.market);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Código inválido.",
      );
    } finally {
      setPending2fa(false);
    }
  }

  if (challengeToken) {
    return (
      <div className="mx-auto w-full max-w-sm space-y-7 py-10">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              Verificação em 2 etapas
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Digite o código do autenticador
              {emailHint ? ` (${emailHint})` : ""}.
            </p>
          </div>
        </div>

        <form onSubmit={(e) => void onVerify2fa(e)} className="space-y-5">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(-1);
                  const next = [...otp];
                  next[index] = v;
                  setOtp(next);
                  if (v && index < 5) otpRefs.current[index + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[index] && index > 0) {
                    otpRefs.current[index - 1]?.focus();
                  }
                }}
                className="size-11 rounded-md text-center text-lg font-semibold"
                aria-label={`Dígito ${index + 1}`}
              />
            ))}
          </div>

          {error ? (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending2fa}>
            {pending2fa ? "Validando…" : "Continuar"}
          </Button>
        </form>
      </div>
    );
  }

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
