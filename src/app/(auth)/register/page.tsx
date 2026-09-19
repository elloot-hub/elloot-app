import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { loginHref } from "@/features/auth/safe-next";

export const metadata: Metadata = {
  title: "Registrar",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  const loginLink = loginHref(params.next);

  return (
    <RequireGuest>
      <AuthSplitShell
        topRight={
          <p className="hidden text-sm text-muted-foreground sm:block">
            Já tem uma conta?{" "}
            <Link
              href={loginLink}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        }
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Carregando…</p>
          }
        >
          <RegisterForm />
        </Suspense>
      </AuthSplitShell>
    </RequireGuest>
  );
}
