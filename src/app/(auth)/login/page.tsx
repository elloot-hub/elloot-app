import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <RequireGuest>
      <AuthSplitShell
        topRight={
          <p className="hidden text-sm text-muted-foreground sm:block">
            Não tem uma conta?{" "}
            <Link
              href={routes.register}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Registrar
            </Link>
          </p>
        }
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Carregando…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </AuthSplitShell>
    </RequireGuest>
  );
}
