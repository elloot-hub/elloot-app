"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DownloadIcon, ReceiptIcon, SearchIcon } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import type { WalletLedgerEntry } from "@/features/wallet/api";
import { LEDGER_FILTER_OPTIONS, LEDGER_TYPE_META, filterLedgerEntries, formatLedgerEntryDetail, groupLedgerByDay, ledgerOrderHref, ledgerTypeLabel, summarizeLedger, type LedgerFilter, } from "@/features/wallet/wallet-ledger-utils";
import { formatBRLFromCents, formatDateTimePt } from "@/lib/format";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const VISIBLE_LIMIT = 12;

type Props = {
  entries: WalletLedgerEntry[];
  balanceCents: number;
  onExport: () => void;
};

function LedgerRow({ entry }: { entry: WalletLedgerEntry }) {
  const meta = LEDGER_TYPE_META[entry.type];
  const Icon = meta?.icon ?? ReceiptIcon;
  const isCredit = entry.amountCents >= 0;

  const body = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md",
          isCredit
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{ledgerTypeLabel(entry.type)}</p>
        <p className="text-xs text-muted-foreground text-pretty break-words">
          {formatLedgerEntryDetail(entry)}
        </p>
        {entry.orderCode ? (
          <p className="mt-0.5 text-[11px] font-medium text-primary/80">
            {entry.orderCode}
          </p>
        ) : null}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatDateTimePt(entry.createdAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {isCredit ? "+" : ""}
          {formatBRLFromCents(entry.amountCents)}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          Saldo {formatBRLFromCents(entry.balanceAfter)}
        </p>
      </div>
    </>
  );

  if (entry.orderId) {
    const orderRef = ledgerOrderHref(entry);
    return (
      <li>
        <Link
          href={routes.order(orderRef!)}
          className="flex items-center gap-3 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/30 sm:px-4"
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 bg-card/30 px-3 py-3 sm:px-4">
      {body}
    </li>
  );
}

export function WalletLedgerSection({ entries, balanceCents, onExport }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LedgerFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () => filterLedgerEntries(entries, query, typeFilter),
    [entries, query, typeFilter],
  );
  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);
  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_LIMIT);
  const groups = useMemo(() => groupLedgerByDay(visible), [visible]);
  const hasMore = filtered.length > VISIBLE_LIMIT;

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Extrato</h2>
          <p className="text-xs text-muted-foreground">
            {summary.count === entries.length
              ? `${entries.length} movimentação(ões) registradas`
              : `${summary.count} de ${entries.length} com os filtros atuais`}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative order-first min-w-0 w-full flex-1 sm:order-none sm:min-w-[14rem]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowAll(false);
            }}
            placeholder="Buscar por descrição ou pedido…"
            className="h-9 rounded-md border-border/70 bg-background/70 pl-9"
          />
        </div>

        <div className="flex w-full gap-2 sm:w-auto">
          <Select
            value={typeFilter}
            items={LEDGER_FILTER_OPTIONS}
            onValueChange={(value) => {
              setTypeFilter((value ?? "all") as LedgerFilter);
              setShowAll(false);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {LEDGER_FILTER_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={onExport}
            disabled={entries.length === 0}
          >
            <DownloadIcon className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border/70 bg-card/20 px-4 py-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhuma movimentação ainda</p>
            <p className="text-xs text-muted-foreground text-pretty">
              Vendas liberadas, saques e reembolsos aparecem aqui automaticamente.
            </p>
          </div>
          <Link href={routes.dashboardSales} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
            Ver vendas
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-border/60 bg-card/40 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma movimentação encontrada com esses filtros.
        </p>
      ) : (
        <>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.day} className="space-y-2">
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px w-full bg-border/60" />
                  <p className="text-xs text-nowrap font-medium text-muted-foreground">
                    {group.day}
                  </p>
                  <div className="h-px w-full bg-border/60" />
                </div>

                <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/60">
                  {group.entries.map((entry) => (
                    <LedgerRow key={entry.id} entry={entry} />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {hasMore ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll
                ? "Mostrar menos"
                : `Ver todas (${filtered.length})`}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
