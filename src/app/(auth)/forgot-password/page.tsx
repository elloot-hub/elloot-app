import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Esqueceu a senha",
};

export default function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </AuthSplitShell>
    </RequireGuest>
  );
}
