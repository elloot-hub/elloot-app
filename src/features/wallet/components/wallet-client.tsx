"use client";

import { useEffect, useState } from "react";
import {
  fetchWallet,
  type WalletLedgerEntry,
} from "@/features/wallet";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";

const TYPE_LABEL: Record<string, string> = {
  CREDIT_SALE: "Venda liberada",
  DEBIT_PAYOUT: "Saque",
  PLATFORM_FEE: "Taxa",
  REFUND: "Reembolso",
  ADJUSTMENT: "Ajuste",
};

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
        <p className="mt-2 text-xs text-muted-foreground">
          Saque PIX será liberado na próxima etapa (chave em Conta).
        </p>
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
