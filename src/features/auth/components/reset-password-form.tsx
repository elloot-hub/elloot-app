"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";

import { resetPassword } from "@/features/auth/api";
import {
  PASSWORD_MIN_LENGTH,
  passwordPolicyHint,
  validatePassword,
} from "@/features/auth/password-policy";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Link inválido
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Este link de redefinição está incompleto. Solicite um novo em
            “Esqueceu a senha?”.
          </p>
        </div>
        <Link
          href={routes.forgotPassword}
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Senha atualizada
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Sua senha foi redefinida. Entre com a nova senha.
          </p>
        </div>
        <Button
          type="button"
          className="h-11 rounded-xl"
          onClick={() => router.replace(routes.login)}
        >
          Ir para o login
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setPending(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível redefinir a senha.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Nova senha
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {passwordPolicyHint()}
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">
            Nova senha <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
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

        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirmar senha <span className="text-primary">*</span>
          </Label>
          <div className="relative">
            <LockIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 rounded-xl pr-3 pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="h-11 rounded-xl" disabled={pending}>
          {pending ? "Salvando…" : "Salvar senha"}
        </Button>
      </form>
    </div>
  );
}
