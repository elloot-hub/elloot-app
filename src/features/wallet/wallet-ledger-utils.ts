import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PercentIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import type { WalletLedgerEntry } from "@/features/wallet/api";

export type LedgerFilter = "all" | WalletLedgerEntry["type"];

export const LEDGER_TYPE_META: Record<
  string,
  { label: string; icon: LucideIcon; credit?: boolean }
> = {
  CREDIT_SALE: {
    label: "Venda liberada",
    icon: ArrowDownLeftIcon,
    credit: true,
  },
  DEBIT_PAYOUT: {
    label: "Saque",
    icon: ArrowUpRightIcon,
    credit: false,
  },
  PLATFORM_FEE: {
    label: "Taxa da plataforma",
    icon: PercentIcon,
    credit: false,
  },
  REFUND: {
    label: "Reembolso",
    icon: RotateCcwIcon,
    credit: true,
  },
  ADJUSTMENT: {
    label: "Ajuste",
    icon: SlidersHorizontalIcon,
  },
};

export const LEDGER_FILTER_OPTIONS: Array<{ value: LedgerFilter; label: string }> =
  [
    { value: "all", label: "Todos os tipos" },
    { value: "CREDIT_SALE", label: "Vendas" },
    { value: "DEBIT_PAYOUT", label: "Saques" },
    { value: "PLATFORM_FEE", label: "Taxas" },
    { value: "REFUND", label: "Reembolsos" },
    { value: "ADJUSTMENT", label: "Ajustes" },
  ];

export function ledgerTypeLabel(type: string) {
  return LEDGER_TYPE_META[type]?.label ?? type;
}

/** Human-readable line for extrato rows (listing title or pedido). */
export function formatLedgerEntryDetail(entry: WalletLedgerEntry) {
  if (entry.listingTitle) return entry.listingTitle;
  if (entry.orderCode) return `Pedido ${entry.orderCode}`;
  return entry.description ?? "Movimentação na carteira";
}

export function ledgerOrderHref(entry: WalletLedgerEntry) {
  if (!entry.orderId) return null;
  return entry.orderCode ?? entry.orderId;
}

export function filterLedgerEntries(
  entries: WalletLedgerEntry[],
  query: string,
  type: LedgerFilter,
) {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (type !== "all" && entry.type !== type) return false;
    if (!q) return true;
    const haystack = [
      ledgerTypeLabel(entry.type),
      entry.description ?? "",
      entry.orderId ?? "",
      entry.orderCode ?? "",
      entry.listingTitle ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function summarizeLedger(entries: WalletLedgerEntry[]) {
  let creditsCents = 0;
  let debitsCents = 0;
  for (const entry of entries) {
    if (entry.amountCents >= 0) creditsCents += entry.amountCents;
    else debitsCents += Math.abs(entry.amountCents);
  }
  return { creditsCents, debitsCents, count: entries.length };
}

export function formatLedgerDayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfEntry = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfEntry.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function groupLedgerByDay(entries: WalletLedgerEntry[]) {
  const groups: Array<{ day: string; entries: WalletLedgerEntry[] }> = [];
  for (const entry of entries) {
    const day = formatLedgerDayLabel(entry.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) {
      last.entries.push(entry);
    } else {
      groups.push({ day, entries: [entry] });
    }
  }
  return groups;
}

export function downloadWalletCsv(
  balanceCents: number,
  entries: WalletLedgerEntry[],
) {
  const rows: string[][] = [
    ["Saldo atual (centavos)", String(balanceCents)],
    [],
    ["Data", "Tipo", "Descrição", "Valor (centavos)", "Saldo após"],
    ...entries.map((entry) => [
      entry.createdAt,
      ledgerTypeLabel(entry.type),
      formatLedgerEntryDetail(entry),
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
