"use client";

import Link from "next/link";
import { BadgeCheckIcon, ShieldAlertIcon } from "lucide-react";
import { useAuth } from "@/features/auth/context";
import { buttonVariants } from "@/components/ui/button";
import { VerificationSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function VerificationClient() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <VerificationSkeleton />;
  }

  const status = user.kycStatus ?? "NONE";
  const approved = status === "APPROVED";
  const pending = status === "PENDING";

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border/60 bg-card/40 p-5">
        <div className="flex items-start gap-3">
          {approved ? (
            <BadgeCheckIcon className="size-8 text-emerald-400" />
          ) : (
            <ShieldAlertIcon className="size-8 text-amber-400" />
          )}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {approved
                ? "Documentos verificados"
                : pending
                  ? "Verificação em análise"
                  : "Verificação pendente"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Status atual:{" "}
              <span className="font-mono text-foreground">{status}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {approved
                ? "Sua conta transmite mais confiança para compradores."
                : "O fluxo completo de envio de documentos entra em breve. Por enquanto o status vem do backend (KYC)."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "E-mail", ok: Boolean(user.email) },
          { label: "Telefone", ok: false },
          { label: "Documentos", ok: approved },
        ].map((row) => (
          <div
            key={row.label}
            className={cn(
              "rounded-md border px-3 py-3 text-sm",
              row.ok
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border-border/60 bg-muted/20 text-muted-foreground",
            )}
          >
            <p className="font-medium">{row.label}</p>
            <p className="text-xs">{row.ok ? "Verificado" : "Pendente"}</p>
          </div>
        ))}
      </div>

      <Link
        href={routes.dashboardSettings}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
      >
        Voltar às configurações
      </Link>
    </div>
  );
}
