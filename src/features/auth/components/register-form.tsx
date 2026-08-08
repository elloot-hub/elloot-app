"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MailIcon, UserRoundIcon } from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

import { discordAuthUrl, fetchProviders, googleAuthUrl } from "@/features/auth/api";
import { useAuth } from "@/features/auth/context";
import { ApiError } from "@/lib/api/errors";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [providers, setProviders] = useState({
    google: true,
    discord: true,
  });

  useEffect(() => {
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await register({
        email,
        password,
        name: name.trim() || undefined,
      });
      router.replace(routes.market);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível criar a conta.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="flex size-11 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground">
          <UserRoundIcon className="size-5" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
            Criar sua conta
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            Cadastre-se para comprar e vender com escrow.
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">ou</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl px-3"
            placeholder="Como devemos te chamar"
          />
        </div>
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
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl px-3"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="flex-1 py-3 px-8"
          disabled={pending}
        >
          {pending ? "Criando…" : "Registrar"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground sm:hidden">
        Já tem conta?{" "}
        <Link href={routes.login} className="font-medium text-primary">
          Entrar
        </Link>
      </p>
    </div>
  );
}

function SocialButton({ href, enabled, label, icon, }: { href?: string; enabled: boolean; label: string; icon: React.ReactNode; }) {
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
};