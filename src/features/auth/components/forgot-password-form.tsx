"use client";

import Link from "next/link";
import { useState } from "react";
import { MailIcon } from "lucide-react";

import { requestPasswordReset } from "@/features/auth/api";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/lib/routes";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await requestPasswordReset({ email });
      setSent(true);
      setDebugUrl(res.resetUrl ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar o link.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Verifique seu e-mail
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Se existir uma conta com senha para esse endereço, enviamos um link
            para redefinir a senha. O link expira em 1 hora.
          </p>
        </div>
        {debugUrl ? (
          <p className="rounded-xl border border-border bg-muted/40 p-3 text-xs break-all text-muted-foreground">
            Dev:{" "}
            <Link href={debugUrl} className="text-primary underline">
              {debugUrl}
            </Link>
          </p>
        ) : null}
        <Link
          href={routes.login}
          className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          Esqueceu a senha?
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Informe o e-mail da sua conta. Enviaremos um link para criar uma nova
          senha.
        </p>
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

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="h-11 rounded-xl" disabled={pending}>
          {pending ? "Enviando…" : "Enviar link"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href={routes.login} className="font-medium text-primary">
          Entrar
        </Link>
      </p>
    </div>
  );
}
