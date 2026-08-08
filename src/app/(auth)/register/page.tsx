import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Registrar",
};

export default function RegisterPage() {
  return (
    <RequireGuest>
      <AuthSplitShell
        topRight={
          <p className="hidden text-sm text-muted-foreground sm:block">
            Já tem uma conta?{" "}
            <Link
              href={routes.login}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        }
      >
        <RegisterForm />
      </AuthSplitShell>
    </RequireGuest>
  );
}
