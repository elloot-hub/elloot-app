import type { Metadata } from "next";
import Link from "next/link";
import { AuthSplitShell } from "@/features/auth/components/auth-split-shell";
import { RequireGuest } from "@/features/auth/components/require-guest";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

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
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Esqueceu a senha?
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              A recuperação por e-mail ainda não está disponível nesta versão.
              Use login social, se estiver ativo, ou volte ao login.
            </p>
          </div>
          <Link
            href={routes.login}
            className={cn(buttonVariants(), "h-11 rounded-xl px-8")}
          >
            Voltar ao login
          </Link>
        </div>
      </AuthSplitShell>
    </RequireGuest>
  );
}
