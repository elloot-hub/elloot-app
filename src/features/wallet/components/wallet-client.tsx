"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";
import {
  fetchWallet,
  type WalletLedgerEntry,
} from "@/features/wallet";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  CREDIT_SALE: "Venda liberada",
  DEBIT_PAYOUT: "Saque",
  PLATFORM_FEE: "Taxa",
  REFUND: "Reembolso",
  ADJUSTMENT: "Ajuste",
};

function downloadWalletCsv(
  balanceCents: number,
  entries: WalletLedgerEntry[],
) {
  const rows: string[][] = [
    ["Saldo atual (centavos)", String(balanceCents)],
    [],
    ["Data", "Tipo", "Descrição", "Valor (centavos)", "Saldo após"],
    ...entries.map((entry) => [
      entry.createdAt,
      TYPE_LABEL[entry.type] ?? entry.type,
      entry.description ?? "",
      String(entry.amountCents),
      String(entry.balanceAfter),
    ]),
  ];
  const body = rows
    .map((line) =>
      line
        .map((cell) => {
          const raw = String(cell);
          return /[",\n;]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
        })
        .join(";"),
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${body}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `elloot-extrato-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WalletClient() {
  const [balanceCents, setBalanceCents] = useState(0);
  const [entries, setEntries] = useState<WalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWallet();
        if (!cancelled) {
          setBalanceCents(data.balanceCents);
          setEntries(data.entries);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Não foi possível carregar a carteira.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <WalletSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-border/60 bg-card/40 p-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Saldo disponível
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-primary tabular-nums">
          {formatBRLFromCents(balanceCents)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={routes.dashboardWithdrawals}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Sacar
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => downloadWalletCsv(balanceCents, entries)}
            disabled={entries.length === 0}
          >
            <DownloadIcon className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Extrato</h2>
        {entries.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhuma movimentação ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 bg-card/30 px-3 py-3 sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {TYPE_LABEL[entry.type] ?? entry.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.description ??
                      new Date(entry.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p
                  className={
                    entry.amountCents >= 0
                      ? "text-sm font-semibold text-emerald-500 tabular-nums"
                      : "text-sm font-semibold text-destructive tabular-nums"
                  }
                >
                  {entry.amountCents >= 0 ? "+" : ""}
                  {formatBRLFromCents(entry.amountCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
