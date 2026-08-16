"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context";
import { fetchWallet } from "@/features/wallet";
import {
  createPayout,
  fetchMyPayouts,
  type Payout,
} from "@/features/wallet/payouts-api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { WalletSkeleton } from "@/features/dashboard/components/dashboard-skeletons";
import { ApiError } from "@/lib/api/errors";
import { formatBRLFromCents } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: "Em análise",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

export function WithdrawalsClient() {
  const { user, refreshUser } = useAuth();
  const [balanceCents, setBalanceCents] = useState(0);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [wallet, { payouts: rows }] = await Promise.all([
        fetchWallet(),
        fetchMyPayouts(),
      ]);
      setBalanceCents(wallet.balanceCents);
      setPayouts(rows);
      setPixKey(user?.pixKey ?? "");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar os saques.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.pixKey]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const parsed = Number(amount.replace(",", "."));
    const amountCents = Math.round(parsed * 100);
    if (!Number.isFinite(amountCents) || amountCents < 500) {
      setError("Valor mínimo de saque: R$ 5,00.");
      setSubmitting(false);
      return;
    }
    try {
      await createPayout({
        amountCents,
        pixKey: pixKey.trim() || undefined,
      });
      setAmount("");
      setSuccess("Saque solicitado. O valor saiu do saldo disponível.");
      await refreshUser();
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível solicitar o saque.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <WalletSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-card/40 p-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Saldo disponível
          </p>
          <p className="mt-2 text-3xl font-bold text-primary tabular-nums">
            {formatBRLFromCents(balanceCents)}
          </p>
        </div>
        <div className="rounded-md border border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
          O saque debita o saldo imediatamente e fica em análise para pagamento
          via PIX. Mínimo R$ 5,00.
          <div className="mt-3">
            <Link
              href={routes.dashboardWallet}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ver extrato
            </Link>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-md border border-border/60 bg-card/40 p-5"
      >
        <h2 className="text-base font-semibold">Solicitar saque</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="payout-amount">Valor (R$)</FieldLabel>
            <Input
              id="payout-amount"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="payout-pix">Chave PIX</FieldLabel>
            <Input
              id="payout-pix"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Sua chave PIX"
              maxLength={140}
            />
          </Field>
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {success}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting || balanceCents < 500}>
          {submitting ? "Solicitando…" : "Solicitar saque"}
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico de saques</h2>
        {payouts.length === 0 ? (
          <p className="rounded-md border border-border/60 bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum saque solicitado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
            {payouts.map((payout) => (
              <li
                key={payout.id}
                className="flex items-center justify-between gap-3 bg-card/30 px-3 py-3 sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {STATUS_LABEL[payout.status] ?? payout.status}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {payout.pixKey} ·{" "}
                    {new Date(payout.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatBRLFromCents(payout.amountCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
