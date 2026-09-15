import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default function ResetPasswordPage() {
  return (
    <RequireGuest>
      <AuthSplitShell
        topRight={
          <Link
            href={routes.login}
            className="hidden text-sm font-medium text-primary underline-offset-4 hover:underline sm:inline"
          >
            Voltar ao login
          </Link>
        }
      >
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">Carregando…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthSplitShell>
    </RequireGuest>
  );
}
