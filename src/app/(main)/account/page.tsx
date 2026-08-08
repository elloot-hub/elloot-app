"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { useAuth } from "@/features/auth/context";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <Container className="space-y-6 py-12">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Minha conta</h1>
          <p className="text-muted-foreground">Perfil da sessão atual.</p>
        </div>
        {user ? (
          <dl className="grid gap-4 rounded-2xl border border-border/70 bg-background/60 p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="mt-1 font-medium">{user.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="mt-1 font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Função</dt>
              <dd className="mt-1 font-mono">{user.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Chave PIX</dt>
              <dd className="mt-1 font-mono">
                {user.pixKey ?? "não definida"}
              </dd>
            </div>
          </dl>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link
            href={routes.market}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Mercado
          </Link>
          <Link
            href={routes.wallet}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Carteira
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push(routes.home);
            }}
            className={cn(buttonVariants({ variant: "ghost" }))}
          >
            Sair
          </button>
        </div>
      </Container>
    </RequireAuth>
  );
}
