"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

import {
  discordAuthUrl,
  fetchProviders,
  googleAuthUrl,
} from "@/features/auth/api";
import { useAuth } from "@/features/auth/context";
import { safeNextPath } from "@/features/auth/safe-next";
import {
  isLoginRequires2fa,
  verify2faLogin,
} from "@/features/auth/two-factor-api";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";

const REMEMBER_KEY = "elloot.rememberEmail";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [providers, setProviders] = useState({
    google: true,
    discord: true,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    } catch {
      /* ignore */
    }

    void fetchProviders()
      .then((res) =>
        setProviders({
          google: res.providers.google,
          discord: res.providers.discord,
        }),
      )
      .catch(() =>
        setProviders({
          google: false,
          discord: false,
        }),
      );
  }, []);

  function finishRemember() {
    try {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {
      /* ignore */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await login({ email, password });
      if (result && isLoginRequires2fa(result)) {
        setChallengeToken(result.challengeToken);
        setOtp(["", "", "", "", "", ""]);
        return;
      }
      finishRemember();
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível entrar.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onVerify2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Digite o código de 6 dígitos.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const result = await verify2faLogin({ challengeToken, code });
      await setSession(null, result.user!);
      finishRemember();
      router.replace(safeNextPath(searchParams.get("next")));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Código inválido.",
      );
    } finally {
      setPending(false);
    }
  }

  if (challengeToken) {
    return (
      <div className="space-y-7">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-center text-2xl font-semibold tracking-tight">
              Verificação em 2 etapas
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              Digite o código de 6 dígitos do Google Authenticator.
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

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Validando…" : "Continuar"}
          </Button>
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setChallengeToken(null);
              setOtp(["", "", "", "", "", ""]);
              setError(null);
            }}
          >
            Voltar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
          <UserRoundIcon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Entrar na sua conta
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Digite seus dados para fazer login.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <SocialButton
          href={providers.discord ? discordAuthUrl() : undefined}
          enabled={providers.discord}
          label="Discord"
          icon={<SiDiscord />}
        />
        <SocialButton
          href={providers.google ? googleAuthUrl() : undefined}
          enabled={providers.google}
          label="Google"
          icon={<FcGoogle />}
        />
      </div>

      <div className="relative select-none">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">
            Endereço de E-mail <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl pr-3 pl-10"
              placeholder="voce@elloot.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Senha <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl pr-10 pl-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            Manter-me logado
          </label>
          <Link
            href={routes.forgotPassword}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="flex-1 px-8 py-3" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground sm:hidden">
        Não tem conta?{" "}
        <Link href={routes.register} className="font-medium text-primary">
          Registrar
        </Link>
      </p>
    </div>
  );
}

function SocialButton({
  href,
  enabled,
  label,
  icon,
}: {
  href?: string;
  enabled: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const className = cn(
    buttonVariants({ variant: "outline" }),
    "h-11 w-full gap-2 rounded-xl",
  );

  if (enabled && href) {
    return (
      <a href={href} className={className}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      title={`${label} ainda não configurado`}
      className={cn(className, "opacity-50")}
    >
      {icon}
      {label}
    </button>
  );
}
